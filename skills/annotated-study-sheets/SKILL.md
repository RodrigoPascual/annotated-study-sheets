---
name: annotated-study-sheets
description: Make an annotated study copy of a paper, article, PDF or slide deck — a new PDF where every original page sits next to a handwritten-style notes page, with numbered pencil marks, highlighter and boxes drawn on the original — or build a new offline HTML presentation with a clean version and an annotated version toggled with the N key. Use when the user wants to study, explain, annotate or review a document ("annotate this paper", "study guide", "explain this PDF page by page", "notes next to each page") or wants a study deck / talk with speaker notes.
---

# Annotated Study Sheets

Two deliverables, two engines. Never write your own styling for either: the look lives in the engine files.

1. **Annotated PDF** (papers, articles, reports, any PDF; slides exported to PDF) → `<name>-annotated.pdf`.
   Every page of the output is a spread: the **original page on the left, untouched**, with numbered pencil brackets,
   badges, highlighter and hand-drawn boxes on top of it, and a **notes page on the right** (dotted paper, handwriting,
   coloured boxes) whose blocks sit beside what they explain. Engine: `assets/pdf/studysheet.sty` (LuaLaTeX),
   driven by `scripts/annotate_pdf.py`. **A PDF is annotated as a PDF, never converted to HTML.**
2. **Study deck** (a new talk) → an offline HTML presentation. Plain 16:9 slides for the audience; press **N** and the
   slide moves left, pencil marks are drawn on it and a handwritten sheet writes itself in on the right. Engine:
   `assets/study.css` + `assets/study.js`, started with `scripts/new_study.py`.

## Never touch the original

Annotating an existing file always works on a copy in a new sibling folder named after it plus `-annotated`
(`paper.pdf` → `paper-annotated/paper-annotated.pdf`; `talk/index.html` → `talk-annotated/`). Do not edit, rename,
overwrite or delete the original or its folder. `annotate_pdf.py init` and `new_study.py --source` do this for you.

## A. Annotate a PDF → annotated PDF

Requirements: `pip install pymupdf` and LuaLaTeX (TeX Live or MiKTeX). If `lualatex` is missing, tell the user to
install TeX Live (or MiKTeX on Windows) and stop; do not fall back to HTML.
Word / PowerPoint / Keynote / web page → export or print to PDF first, into the `-annotated` folder.

1. **Copy and set up:** `python scripts/annotate_pdf.py init paper.pdf [--lang es] [--pages 1-12]`
   → `paper-annotated/` with `source/paper.pdf` (copy), `source/text.txt`, `studysheet.sty`, `main.tex`, `notes/pNN.tex`.
2. **Read the whole document** (`source/text.txt`, and look at the pages) before writing anything. In `main.tex`, set
   `\StudySections{key/Label,...}` (the section pills of the header) and the footer.
3. **For each page, in order:**
   - `annotate_pdf.py anchors paper-annotated N --png` (and `--lines`, `--find "text"`): positions in mm from the
     page's top-left corner; look at `review/orig_pNN.png`.
   - List every element top to bottom (paragraph groups, figure panels, tables, equations) and number them 1, 2, 3…
   - Write `notes/pNN.tex`: marks on the original (`\bracket`, `\badge`, `\highlight`, `\pencilbox`, `\ring`) and
     one `\block[y=…]` per element, starting with `\num{n}`, at the height of what it explains.
   - `annotate_pdf.py build paper-annotated -p N --png`; the report must end in `OK`. **Open `review/pNN.png`**: every
     mark on its target, nothing crowded, 45–75 % of the notes page used. Fix and rebuild until it looks clean.
4. **Build everything:** `annotate_pdf.py build paper-annotated` → `paper-annotated.pdf` (spreads) and
   `paper-annotated-two-page.pdf` (original, notes, original, notes… for A4 printing). Give the user the path.

Macros, options and a full notes file: `references/annotate-pdf.md`. Example: `examples/chain-of-thought-annotated/`.

### What to write on a notes page

- **Explain, do not translate or paraphrase**: say what each element is, how to read it and why it matters, in short
  sentences and simple words; define each term the first time.
- **A figure**: what it shows, how to read it (axes, units, colours, markers, panels), the one comparison to look at.
  **A table**: rows, columns, the 1–3 numbers that matter. **An equation**: each symbol, the intuition, a tiny toy
  example when it helps (labelled as toy numbers).
- One `keyidea` per page (two at most); one `selftest` ("Check yourself": a question that makes the reader think,
  then `\answer{...}`) per page; `warning` for
  easy confusions; `\orig{...}` for a term exactly as printed, so the reader can map your words to the original.
- **Numbers are sacred**: exactly as printed on the left page; never invent or recompute results.
- Leave white space: the dotted paper is also for the reader's own notes.
- Write in the user's language (`--lang es` for Spanish labels).

## B. Build a new study deck (HTML)

```bash
python scripts/new_study.py deck OUT_DIR --title "Talk title" --author "Name · Group" [--lang es]
python scripts/new_study.py deck --source talk/index.html     # add notes to an existing HTML talk -> talk-annotated/
```

The script copies `study.css` and `study.js` byte for byte plus the template. Then only write slide HTML and notes:
do not edit, inline or "improve" the engine, do not add CSS frameworks, do not restyle the sheet (per-deck tweaks go in
a small `<style>` block with the CSS variables in `references/slide-layouts.md`). Example: `examples/kan-explained/`.

1. Outline: sections → slides, one message per slide. Slide content stays **short** (≤ 4 bullets, ≤ 12 words each,
   figures large); the depth goes into the notes.
2. Mark the elements the notes talk about with `data-n="1"`, `data-n="2"`… top to bottom (2–4 per slide); panels of an
   image use `data-zones="n:x0,y0,x1,y1"` (percent of the image). At most one `<span class="hl">` per slide.
3. Write the notes of every slide in `<aside class="notes">` (markup below).
4. Check: open `index.html?notes#1` (or a headless screenshot): badges on target, the sheet does not overflow.

**Chat-only assistants** (no scripts, no file copies): still never write CSS/JS for a deck. Use
`assets/deck-template.html` as is; it loads the engine from the CDN when the local files are missing:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/RodrigoPascual/annotated-study-sheets@v1/skills/annotated-study-sheets/assets/study.css">
<script src="https://cdn.jsdelivr.net/gh/RodrigoPascual/annotated-study-sheets@v1/skills/annotated-study-sheets/assets/study.js"></script>
```

For a PDF they cannot compile, they write the `notes/pNN.tex` files (section 3 of `references/annotate-pdf.md`) and the
user runs `annotate_pdf.py build`.

Layouts, classes and configuration: `references/slide-layouts.md`. Notes syntax with examples: `references/notes-syntax.md`.

## Deck notes markup (inside `<aside class="notes">`)

```
# Title of the sheet
! The key idea of this slide in one sentence (yellow "Key idea" box, max one).
(1) Block linked to the element with data-n="1" / zone 1 (red badge; hover draws an arrow to it).
- bullet        -- sub-bullet
> Source (2024): the claim from the literature that backs this (blue box).
?? Self-test question? Its answer ("Check yourself" box; the answer stays blurred until clicked).
warn: the pitfall people miss (red box).        ex: a concrete example (green box).
f: the formula, written plainly (purple box).    | table | rows |  (first row = header)
→ What comes next (red arrow line, last line).
```
Inline: `**bold**`, `==highlight==`, `*italic*`, `[2]` (small badge pointing to element 2), `x_{i}`, `x^{2}`.

## Writing deck notes — the part that matters

- **Explain, do not paraphrase.** Each `(n)` block says what the element is, how to read it (axes, units, colours, symbols)
  and why it matters. Define every term the first time it appears.
- **One key idea per slide** (`!`), phrased as the sentence a student should remember.
- **End with a self-test** (`??`): one question that makes the student think (apply, compare, predict, explain why),
  then its answer. It checks understanding; it is not about preparing a defence.
- **Numbers are sacred**: copy figures exactly from the source; never invent results. If something is your inference, say so.
- **Cite, do not copy**: quote at most a short phrase; summarise in your own words; `>` boxes name the source.
- Keep each sheet to what fits one screen (≈ 8–14 lines of notes). Split into two slides rather than overflow.
- Match the user's language: set `lang: 'es'` for Spanish UI labels; write the notes in the user's language.
- Style: informal but rigorous, short bullets; no decorative coloured boxes on the slides themselves — colour lives in the sheet.

## Output checklist

Annotated PDF:
- [ ] `<name>-annotated/<name>-annotated.pdf` (+ `-two-page.pdf`); the original file untouched (same bytes, same place).
- [ ] Every annotated page has its notes; every number marked on the original has its `\num{n}` block, and vice versa.
- [ ] The last build report ends in `OK`; each `review/pNN.png` checked by eye.

Study deck:
- [ ] Folder with `index.html`, `study.css`, `study.js` and the images; opens offline with a double click.
- [ ] Every slide has notes; every `(n)` has a matching `data-n` or zone, and vice versa.
- [ ] Rendered at 1920×1080 with `?notes`: badges on target, sheet not overflowing, no text cut off.
- [ ] Tell the user the keys: **N** sheet · **E** edit · **P** presenter · **O** overview · **?** help.
