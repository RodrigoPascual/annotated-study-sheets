# Cómo publicar el repositorio (paso a paso)

> Este archivo es solo para ti: **bórralo antes de subir el repositorio** (el paso 3 ya lo deja fuera con `git rm`, o simplemente bórralo).

Carpeta del proyecto:
`C:\Users\pascu\Desktop\00_ACADEMIA_Y_CARRERA_UBU\02_Open_Source\annotated-study-sheets`

## 1. Revisa que todo te gusta

Abre con doble clic:
- `index.html` (la portada de las demos)
- `examples/gradient-descent/index.html` → pulsa **N**, pasa el ratón por un bloque numerado, prueba **E**, **P**, **O**.
- `examples/annotated-paper/index.html` → se abre ya anotado; **N** muestra la página limpia.
- `README.md` (ábrelo en VS Code con la vista previa, Ctrl+Shift+V).

## 2. Crea el repositorio vacío en GitHub

1. Entra en <https://github.com/new>.
2. **Repository name:** `annotated-study-sheets`
3. **Description:** `Turn papers, PDFs and slides into hand-annotated study sheets — an Agent Skill for Claude Code. Offline HTML decks where N reveals the study sheet.`
4. **Public**.
5. **No** marques “Add a README”, ni .gitignore, ni licencia (ya están en la carpeta).
6. Pulsa **Create repository**.

## 3. Sube la carpeta (desde una terminal en la carpeta del proyecto)

```bash
cd "C:/Users/pascu/Desktop/00_ACADEMIA_Y_CARRERA_UBU/02_Open_Source/annotated-study-sheets"
```

```bash
del PUBLICAR.md
```
(en Git Bash: `rm PUBLICAR.md`)

```bash
git init -b main
```

```bash
git add .
```

```bash
git commit -m "Annotated Study Sheets v1.0.0"
```

```bash
git remote add origin https://github.com/RodrigoPascual/annotated-study-sheets.git
```

```bash
git push -u origin main
```

La primera vez, Git abrirá una ventana para iniciar sesión en GitHub en el navegador.
El commit sale con tu nombre (`Rodrigo Pascual`, el que tiene configurado git en este ordenador).

## 4. Activa las demos en vivo (GitHub Pages)

1. En el repositorio: **Settings → Pages**.
2. **Source:** *Deploy from a branch* · **Branch:** `main` · carpeta `/ (root)` → **Save**.
3. En 1–2 minutos estarán en:
   - <https://rodrigopascual.github.io/annotated-study-sheets/>
   - <https://rodrigopascual.github.io/annotated-study-sheets/examples/gradient-descent/#4>
   - <https://rodrigopascual.github.io/annotated-study-sheets/examples/annotated-paper/#1>

   (Los enlaces «Live demo» del README apuntan ahí.)

## 5. Deja el repositorio bonito

En la página principal del repo, el engranaje ⚙ junto a **About**:
- **Website:** `https://rodrigopascual.github.io/annotated-study-sheets/`
- **Topics:** `claude-code`, `agent-skills`, `claude-skills`, `study-notes`, `presentation`, `slides`, `annotation`, `pdf`, `education`, `html-presentation`

**Settings → General → Social preview → Upload an image:** sube `docs/img/deck-annotated.png`
(es la imagen que sale al compartir el enlace en redes).

**Releases → Create a new release:** tag `v1.0.0`, título `v1.0.0 — first release`, y una frase:
*“Annotated study sheets for papers, PDFs and slides, and offline HTML decks with a handwritten study sheet (N).”*

## 6. Comprueba que se instala

En Claude Code (en cualquier proyecto):

```
/plugin marketplace add RodrigoPascual/annotated-study-sheets
```

```
/plugin install annotated-study-sheets@annotated-study-sheets
```

Y prueba: *“Annotate this PDF as a study sheet: ruta/al/paper.pdf”*.

## 7. SEO (ya preparado en los archivos)

- En las tres páginas (`index.html` y los dos ejemplos) ya hay:
  - título y descripción con las palabras clave;
  - etiquetas Open Graph y Twitter, para que al compartir el enlace salga la imagen grande;
  - datos estructurados (`SoftwareSourceCode`);
  - `robots.txt` y `sitemap.xml`.
- GitHub posiciona sobre todo por el **nombre del repo, la descripción, los topics y el primer párrafo del README**.
  Los tres ya tienen las palabras clave: *Claude Code skill, Agent Skills, annotate PDF, study notes, HTML presentation*.
  Usa exactamente la descripción y los topics de los pasos 2 y 5.
- Opcional, para Google: entra en <https://search.google.com/search-console> y añade la propiedad
  `https://rodrigopascual.github.io/annotated-study-sheets/`. Verifícala con la etiqueta HTML que te den: pégala en el
  `<head>` de `index.html`, haz commit y push. Después envía el sitemap `sitemap.xml`.
- Lo que más pesa en SEO son los **enlaces entrantes**: los PR a las listas *awesome* y los posts del paso 8.

## 8. Para conseguir estrellas

- **Listas «awesome»**: abre un PR añadiendo una línea en las listas de skills y de Claude Code más seguidas de GitHub
  (busca `awesome claude skills` y `awesome claude code`). Una línea: nombre, enlace y la frase de la descripción.
- **Reddit**: r/ClaudeAI y r/ClaudeCode — publica el GIF `docs/img/demo-deck.gif` con el título
  *“I made a skill that turns any paper or slide deck into a hand-annotated study sheet (press N)”* y el enlace.
- **X / LinkedIn / Bluesky**: el mismo GIF + enlace a la demo en vivo. Lo visual es lo que funciona.
- **Hacker News**: *“Show HN: Annotated Study Sheets – press N to see the notes behind every slide”*, con el enlace a la demo.
- Cuéntalo a la gente del grupo y a estudiantes: es una herramienta de estudio, y ese público comparte.
- Responde rápido a los primeros issues; añade ejemplos de otros campos (biología, historia) cuando alguien los pida.

## Si más adelante cambias algo

```bash
git add .
```

```bash
git commit -m "Describe el cambio"
```

```bash
git push
```
