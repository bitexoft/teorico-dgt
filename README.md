# teorico-dgt

- index.html
- questions.json
- /images

---

<br>

# Scraper practicatest.com

Script: `scraper.py` — scraper personal de preguntas de conducir (uso privado, sin publicación del contenido).

## 1. Dependencias

```bash
pip install requests beautifulsoup4 pillow
```

- **Pillow** solo se usa para convertir las imágenes (webp/jpg → png).
- Sin Pillow, el script guarda el archivo original renombrado a `.png`; la mayoría de visores lo abren igual.

## 2. Ejecución

```bash
python scraper.py
```

- Si existe `urls.txt` (una URL por línea), usa esas URLs como **semilla**.
- Si no existe, arranca desde una URL por defecto y se expande solo siguiendo las _preguntas relacionadas_ de cada ficha (búsqueda en anchura / BFS).
- **Ctrl+C** en cualquier momento: guarda lo recopilado hasta ese instante.

## 3. Salida

| Fichero          | Contenido                                                                      |
| ---------------- | ------------------------------------------------------------------------------ |
| `preguntas.json` | Preguntas en el formato personal: `id`, `q`, `sd`, `ai`, `type`, `o`, `a`, `e` |
| `imgs/{id}.png`  | Imagen de cada pregunta, nombrada con su número (`388.png`, `389.png`, …)      |
| `errores.log`    | URLs que fallaron tras los reintentos (solo si hay errores)                    |

## 4. Configuración (en `main()`)

| Parámetro    | Por defecto  | Descripción                                       |
| ------------ | ------------ | ------------------------------------------------- |
| `id_inicial` | `388`        | Primer `id` asignado en el JSON                   |
| `limite`     | `500`        | Máximo de preguntas a recopilar                   |
| `delay`      | `(2.0, 4.0)` | Espera aleatoria entre peticiones HTML (segundos) |

## 5. Reanudar / ampliar tandas

1. Mira el último `id` generado en `preguntas.json`.
2. Pon `id_inicial = último_id + 1` en `main()`.
3. Añade nuevas URLs semilla en `urls.txt` (opcional pero da variedad).
4. Las imágenes ya descargadas no se repiten: se saltan si el archivo existe.

## 6. Cortesía y límites

- Con `delay` de 2–4 s y 500 preguntas, el proceso dura **~30–40 min**.
- Las imágenes descargan con espera de 0,5–1,5 s adicional por imagen.
- Si aparecen errores **429/403**: aumenta el delay o pausa el proceso un rato. El script ya reintenta con esperas progresivas (30 s, 60 s, 90 s).

## 7. Verificación antes de producción

Revisa las **primeras 5–10 preguntas** del JSON manualmente:

- `a` apunta al índice correcto dentro de `o` (0 = primera opción).
- `e` tiene la explicación real en la opción correcta y `"Incorrecto."` en las demás.
- Las preguntas con varias opciones correctas quedan como `type: "multiple_choice"`.

## 8. Aviso legal

- Uso **estrictamente personal**; el contenido es propiedad de practicatest.com (© 2026).
- Revisa los términos de uso del sitio antes de raspar; no republicar ni compartir el material obtenido.

# Empezar en el id 1 (por defecto)

python scraper.py

# Empezar en el id 500

python scraper.py --id 500

# Id + límite

python scraper.py --id 500 --limite 100

# También puedes ajustar el delay

python scraper.py --id 500 --limite 100 --delay-min 3 --delay-max 6
