# Instructions for AI assistants using this repository

This repo is the **annotated-study-sheets** skill: it turns a paper, PDF, web page or slide deck into an annotated study
sheet (original on the left with pencil marks, handwritten-style notes on the right, **N** toggles), or builds a new
HTML study deck. The full skill is `skills/annotated-study-sheets/SKILL.md` — read it.

## The one rule: never write your own CSS or JavaScript

The whole look and behaviour is in the engine: `skills/annotated-study-sheets/assets/study.css` and `study.js`.
Your output must be **one `index.html` that uses the engine**, plus the page images. Nothing else.

- If you can run commands: `python skills/annotated-study-sheets/scripts/new_study.py document --source FILE`
  (or `deck OUT_DIR`) and edit only the generated `index.html`.
- If you cannot (chat-only assistant): copy `skills/annotated-study-sheets/assets/document-template.html`
  (or `deck-template.html`) and load the engine from the CDN with exactly these two tags:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/RodrigoPascual/annotated-study-sheets@v1/skills/annotated-study-sheets/assets/study.css">
<script src="https://cdn.jsdelivr.net/gh/RodrigoPascual/annotated-study-sheets@v1/skills/annotated-study-sheets/assets/study.js"></script>
```

**Wrong output** (redo it): a page with its own `<style>` theme, its own slide/keyboard script, a top bar or nav you
wrote, badge `<button>`s positioned by hand, or notes written as HTML cards instead of `<aside class="notes">`.

## What you write

1. One `<section class="slide page">` per page/slide image (`pages/page-01.png` …) — see `examples/chain-of-thought/index.html`.
2. On the `<img>`: `data-zones="1:x0,y0,x1,y1; 2:x0,y0,x1,y1:box"` (percent of the image) for the regions you explain.
3. `<aside class="notes">` in the plain-text markup of `skills/annotated-study-sheets/references/notes-syntax.md`:
   `# title`, `! key idea`, `(1)` block per zone, `-` bullets, `f:` formula, `warn:`, `??` question, `→` next page.
4. `window.STUDY = { title, author, lang: 'en'|'es', openSheet: true, size: [1000,1300] }` (portrait pages;
   use `[1600,900]` for 16:9 slides).

Never modify the user's original file: deliver everything in a folder named `<original-name>-annotated/`.
