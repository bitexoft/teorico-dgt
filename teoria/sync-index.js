#!/usr/bin/env node
/*
 * Sincroniza teoria/teoria.json con las carpetas de teoria/.
 *
 *   node teoria/sync-index.js
 *
 * - Cada subcarpeta de teoria/ es un módulo (p. ej. 12-maniobras).
 * - Cada imagen .webp (recomendado) o .png dentro es una infografía. El orden
 *   lo da el nombre del archivo (01-..., 02-..., 10-...), por eso conviene el
 *   prefijo numérico.
 * - Si existe el .webp de un .png (mismo nombre una vez normalizado: sin acentos y
 *   con guiones), se usa el .webp y se ignora el .png. Si una entrada del JSON
 *   apuntaba a ese .png, se actualiza sola al .webp.
 * - Añade al índice lo que falte (módulos e imágenes nuevas) con datos provisionales.
 * - NUNCA borra ni sobrescribe título, objetivo ni puntos clave ya escritos.
 * - Avisa de entradas cuyo archivo ya no existe y de nombres con acentos/espacios.
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const idxPath = path.join(dir, 'teoria.json');
const idx = fs.existsSync(idxPath)
  ? JSON.parse(fs.readFileSync(idxPath, 'utf8'))
  : { version: 1, modules: [] };
idx.modules = idx.modules || [];

const natural = (a, b) => a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' });
const IMG = /\.(png|webp)$/i;
const stemOf = (f) => f.replace(IMG, '');
const slug = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const humanize = (s) => {
  const t = s.replace(/^\d+[-_ ]*/, '').replace(/[-_]+/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

let added = 0;
const notes = [];

const folders = fs.readdirSync(dir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !/^[._]/.test(d.name))
  .map((d) => d.name)
  .sort(natural);

for (const folder of folders) {
  if (/[^\x21-\x7e]/.test(folder)) {
    notes.push(`! carpeta "${folder}": tiene espacios o acentos; mejor renombrar (p. ej. ${slug(folder)})`);
  }
  let mod = idx.modules.find((m) => m.id === folder);
  if (!mod) {
    mod = { id: folder, title: humanize(folder), description: '', infographics: [] };
    idx.modules.push(mod);
    notes.push(`+ módulo nuevo: ${folder}  (revisa título y descripción)`);
  }
  mod.infographics = mod.infographics || [];

  const all = fs.readdirSync(path.join(dir, folder)).filter((f) => IMG.test(f)).sort(natural);
  const webpBySlug = new Map(all.filter((f) => /\.webp$/i.test(f)).map((f) => [slug(stemOf(f)), f]));

  // Entradas que apuntaban a un .png y ya tienen su .webp (aunque el nombre se haya
  // normalizado: sin acentos, con guiones): se actualizan y conservan todo lo demás
  for (const g of mod.infographics) {
    const w = /\.png$/i.test(g.file) && webpBySlug.get(slug(stemOf(g.file)));
    if (w) {
      notes.push(`~ ${folder}/${g.file} → ${w}  (entrada actualizada a WebP)`);
      g.file = w;
    }
  }

  // Si existe el .webp de un .png (mismo nombre una vez normalizado), se ignora el .png
  const images = all.filter((f) => !(/\.png$/i.test(f) && webpBySlug.has(slug(stemOf(f)))));

  for (const file of images) {
    if (/[^\x21-\x7e]/.test(file)) {
      const ext = file.match(IMG)[0].toLowerCase();
      notes.push(`! ${folder}/${file}: tiene espacios o acentos; mejor renombrar (p. ej. ${slug(stemOf(file))}${ext})`);
    }
    if (mod.infographics.some((g) => g.file === file)) continue;
    const stem = stemOf(file);
    mod.infographics.push({
      id: slug(stem),
      file,
      title: humanize(stem),
      objective: '',
      keyPoints: [],
      examTips: [],
      tags: []
    });
    added++;
    notes.push(`+ infografía nueva: ${folder}/${file}  (completa título, objetivo y puntos clave)`);
  }

  for (const g of mod.infographics) {
    if (!fs.existsSync(path.join(dir, folder, g.file))) {
      notes.push(`! ${folder}/${g.file} está en el JSON pero no existe en disco`);
    }
  }
}

for (const m of idx.modules) {
  if (!folders.includes(m.id)) notes.push(`! módulo "${m.id}" está en el JSON pero no tiene carpeta`);
}

fs.writeFileSync(idxPath, JSON.stringify(idx, null, 2) + '\n');
console.log(notes.length ? notes.join('\n') : 'Todo en orden: el índice ya está al día.');
console.log(`\n${idx.modules.length} módulo(s) · ${added} infografía(s) añadida(s).`);