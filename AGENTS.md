# Instructions for AI assistants using this repository

This repo is the **annotated-study-sheets** skill. The full skill is `skills/annotated-study-sheets/SKILL.md` — read it.
It makes two things:

1. **Annotated PDF** from a paper, article, report or any PDF (slides and web pages: export to PDF first):
   a new PDF where every original page, untouched, sits beside a handwritten-style notes page, with numbered pencil
   marks on the original. **A PDF is never converted to HTML.**
2. **Study deck**: a new offline HTML presentation whose study sheet appears with the **N** key.

Never modify the user's original file: everything goes into a new folder `<original-name>-annotated/`.

## The one rule: never write your own styling

The look lives in the engines. Do not write CSS, JavaScript or LaTeX styling of your own.

**Annotated PDF** — engine `skills/annotated-study-sheets/assets/pdf/studysheet.sty`, driver `scripts/annotate_pdf.py`:

```bash
python skills/annotated-study-sheets/scripts/annotate_pdf.py init paper.pdf [--lang es]   # -> paper-annotated/
python skills/annotated-study-sheets/scripts/annotate_pdf.py anchors paper-annotated 3     # positions in mm
python skills/annotated-study-sheets/scripts/annotate_pdf.py build paper-annotated         # -> paper-annotated.pdf
```

You write only `paper-annotated/notes/pNN.tex` (marks + notes blocks) and the sections line of `main.tex`.
Macros and a full example: `skills/annotated-study-sheets/references/annotate-pdf.md` and
`examples/chain-of-thought-annotated/notes/`. If you cannot run commands, write the `notes/pNN.tex` files and tell the
user to run the `build` command (it needs LuaLaTeX).

**Study deck** — engine `skills/annotated-study-sheets/assets/study.css` + `study.js`:

- If you can run commands: `python skills/annotated-study-sheets/scripts/new_study.py deck OUT_DIR` and edit only the
  generated `index.html`.
- If you cannot (chat-only assistant): copy `skills/annotated-study-sheets/assets/deck-template.html`; it loads the
  engine from the CDN with exactly these two tags:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/RodrigoPascual/annotated-study-sheets@v1/skills/annotated-study-sheets/assets/study.css">
<script src="https://cdn.jsdelivr.net/gh/RodrigoPascual/annotated-study-sheets@v1/skills/annotated-study-sheets/assets/study.js"></script>
```

Then write `<section class="slide">` elements with `data-n` marks and `<aside class="notes">` in the plain-text markup
of `skills/annotated-study-sheets/references/notes-syntax.md`. Example: `examples/kan-explained/index.html`.

**Wrong output** (redo it): an HTML page made from a PDF; a page with its own `<style>` theme, its own slide/keyboard
script, a top bar you wrote, badge `<button>`s positioned by hand, or notes written as HTML cards instead of
`<aside class="notes">`.
