#!/usr/bin/env python3
"""
Convierte a WebP todos los PNG de teoria/<modulo>/ (calidad 80, sin canal alfa),
normaliza el nombre del WebP y BORRA cada PNG una vez comprobado que su WebP
se ha generado correctamente.

Normalización del nombre: minúsculas, sin acentos ni ñ, y las palabras separadas
por guiones (todo lo que no sea letra o número pasa a "-").
    01-Guía_de_seguridad_vial_RSM.png  →  01-guia-de-seguridad-vial-rsm.webp

Uso (desde cualquier carpeta):
    python3 teoria/convertir-a-webp.py           # convierte los que no tienen .webp y borra su PNG
    python3 teoria/convertir-a-webp.py --keep    # convierte pero conserva los PNG
    python3 teoria/convertir-a-webp.py --force   # reconvierte todos, aunque ya exista el .webp

Requiere Pillow:  pip install pillow
Seguridad: el PNG solo se borra si el WebP se decodifica y tiene las mismas
dimensiones. Si algo falla (o dos PNG darían el mismo nombre), el PNG se conserva.
Los PNG que ya tenían .webp (omitidos) tampoco se tocan, ni se renombran los
.webp que ya existían. El borrado es definitivo: haz copia de los originales
si quieres conservarlos.
Después ejecuta:  node teoria/sync-index.js
"""
import re
import sys
import unicodedata
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Falta Pillow. Instálalo con:  pip install pillow")

QUALITY = 80
args = sys.argv[1:]
force = "--force" in args
keep = "--keep" in args
base = Path(__file__).resolve().parent  # la carpeta teoria/


def normalizar(nombre: str) -> str:
    """'Guía_de Señales' -> 'guia-de-senales' (igual que el slug de sync-index.js)."""
    sin_acentos = "".join(c for c in unicodedata.normalize("NFD", nombre) if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "-", sin_acentos.lower()).strip("-")


def kb(p: Path) -> str:
    return f"{p.stat().st_size / 1024:,.0f} KB".replace(",", ".")


pngs = sorted(p for p in base.glob("*/*") if p.is_file() and p.suffix.lower() == ".png")
if not pngs:
    sys.exit("No hay PNG en teoria/*/")

hechos = omitidos = errores = borrados = 0
generados = {}  # WebP creado en esta ejecución -> PNG de origen (detecta nombres repetidos)
for png in pngs:
    rel = png.relative_to(base)
    nombre = normalizar(png.stem)
    if not nombre:
        print(f"✗ {rel}: el nombre queda vacío al normalizarlo  (PNG conservado)")
        errores += 1
        continue
    webp = png.with_name(nombre + ".webp")
    tmp = webp.with_name(webp.name + ".tmp")

    if webp in generados:
        print(f"✗ {rel}: daría el mismo nombre que {generados[webp].name} ({webp.name})  (PNG conservado)")
        errores += 1
        continue
    if webp.exists() and not force:
        print(f"= {rel}: ya existe {webp.name} (usa --force para reconvertir)")
        omitidos += 1
        continue

    try:
        with Image.open(png) as im:
            size = im.size
            im.convert("RGB").save(tmp, "WEBP", quality=QUALITY, method=6)
        with Image.open(tmp) as out:  # comprobar que el resultado es válido
            out.load()
            if out.size != size:
                raise ValueError("el WebP generado no coincide con el original")
        tmp.replace(webp)
    except Exception as e:
        if tmp.exists():
            tmp.unlink()
        print(f"✗ {rel}: {e}  (PNG conservado)")
        errores += 1
        continue

    generados[webp] = png
    peso = f"{kb(png)} → {kb(webp)}"
    hechos += 1
    if keep:
        print(f"✓ {rel} → {webp.name}   {peso}")
    else:
        png.unlink()
        borrados += 1
        print(f"✓ {rel} → {webp.name}   {peso}  (PNG borrado)")

print(f"\n{hechos} convertida(s), {omitidos} omitida(s), {errores} con error · {borrados} PNG borrado(s).")
if hechos:
    print("Siguiente paso:  node teoria/sync-index.js")
sys.exit(1 if errores else 0)