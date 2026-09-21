# Azterketa-teorikoa

- index.html
- questions.json
- /images


---

# Añadir infografías nuevas

## Estructura

```
teoria/
  teoria.json          ← índice de módulos e infografías
  sync-index.js        ← script que añade los PNG nuevos al índice
  12-maniobras/        ← un módulo por carpeta
    01-guia-seguridad-vial-rsm.png
    02-cambios-de-sentido.png
```

## Pasos

1. **Copia el PNG en su carpeta de módulo**, con prefijo numérico (`02-cambios-de-sentido.png`). El orden lo da el nombre del archivo.

2. **Ejecuta el script** desde la raíz del proyecto:

   ```bash
   node teoria/sync-index.js
   ```

   Añade al índice el PNG (y el módulo, si la carpeta es nueva) con datos provisionales, sin tocar lo que ya tienes escrito. También te avisa de nombres con acentos o espacios.

3. **Completa en `teoria.json`** el título, el objetivo y los puntos clave.

---


# Optimizar las infografías para móvil

## ¿Se carga solo la infografía que se pide?

Sí, ya funciona así:

- Al entrar en Teoría solo se descarga el índice (`teoria.json`, unos pocos KB).
- Las listas de módulos e infografías **no llevan imágenes**.
- El PNG se pide únicamente cuando se abre esa infografía.
- Al ampliarla se reutiliza la misma imagen, sin descargarla de nuevo.
- Cada infografía se descarga una sola vez; las siguientes veces sale de la caché del navegador.

## Reducir el peso

La mejor opción es convertir a **WebP**. Pruebas con la infografía real (1536 × 2752 px):

| Opción | Peso | Reducción |
|---|---|---|
| PNG original | 4,7 MB | — |
| PNG optimizado sin perder nada | 4,1 MB | −13 % |
| PNG a 256 colores | 1,8 MB | −62 % |
| WebP calidad 85 | 0,37 MB | −92 % |
| **WebP calidad 80** | **0,32 MB** | **−93 %** |

Al comparar recortes con texto pequeño y con ilustraciones al 100 %, no se aprecia diferencia entre el original y el WebP calidad 80. WebP lo abren todos los navegadores actuales, incluido iOS 14 o superior.

## Cómo convertir

### Sin instalar nada

1. Entra en [squoosh.app](https://squoosh.app).
2. Arrastra el PNG.
3. Elige **WebP**, calidad **80**.
4. Descarga el resultado.

### Con la línea de comandos

Requiere `cwebp` (paquete `webp`): `brew install webp` en Mac o `sudo apt install webp` en Linux.

```bash
# Una imagen
cwebp -q 80 -m 6 -noalpha entrada.png -o salida.webp

# Todas las de teoria/ de golpe
for f in teoria/*/*.png; do cwebp -q 80 -m 6 -noalpha "$f" -o "${f%.png}.webp"; done
```

### Si prefieres seguir con PNG

Cuantizar a 256 colores lo deja en 1,8 MB. Se puede hacer con `pngquant` o con Pillow; el resultado en las pruebas fue con Pillow, y `pngquant` debería dar algo parecido o mejor.

## Cambios necesarios en el proyecto al pasar a WebP

- El visor ya acepta cualquier extensión, porque usa el campo `file` de `teoria.json`.
- `sync-index.js` solo detecta archivos `.png`: habría que ampliarlo para que acepte `.webp`.
- En las entradas de `teoria.json` hay que cambiar `.png` por `.webp` en el campo `file`.

## Resolución

No conviene reducirla. Pasar de 1536 a 1280 px ahorra solo unos 60 KB más y se pierde legibilidad al ampliar.