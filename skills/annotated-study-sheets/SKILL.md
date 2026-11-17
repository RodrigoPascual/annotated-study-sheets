---
name: annotated-study-sheets
description: Turn a paper, PDF, web page or slide deck into an annotated study sheet — the original on the left with hand-drawn numbered marks, a handwritten-style explanation sheet on the right that writes itself in — or build a new HTML presentation with a clean version and an annotated version toggled with the N key. Use when the user wants to study, explain, annotate, review or present a document; asks for "annotated", "study notes", "explain this paper/slides", "study guide", "speaker notes", or wants a self-contained offline HTML talk.
---

# Annotated Study Sheets

Two deliverables, one engine (`assets/study.js` + `assets/study.css`, no dependencies, works from `file://`):

1. **Annotated document** — a PDF / paper / web page / existing presentation turned into page images, each with numbered
   pencil marks on the regions that matter and a study sheet that explains them.
2. **Study deck** — a new 16:9 HTML presentation. Plain slides for the audience; press **N** and the slide slides left,
   pencil brackets and badges are drawn on it, the highlighter sweeps the key phrase and a dotted-paper sheet with
   handwritten notes writes itself in on the right. Hover a numbered block → a pencil arrow points at its element.

Both open with a double click, need no server, and include presenter view (P), overview (O), figure zoom (click),
editable notes (E, saved in the browser or to `notes.js`) and Markdown export.

## The look is in the engine — copy it, never rewrite it

The exact style (dotted paper, handwriting, red numbered badges, pencil brackets and boxes, highlighter sweep, notes that
write themselves in, the pencil arrow, the Beamer-style bars) lives entirely in `assets/study.css` and `assets/study.js`.
**Always start with the script, which copies both files byte for byte plus the right template:**

```bash
python scripts/new_study.py deck     OUT_DIR --title "Talk title" --author "Name · Group"
python scripts/new_study.py document OUT_DIR --title "Paper title" --author "Annotated by Name"
```

Then only write slide HTML and notes. Do not edit, inline, minify or "improve" `study.css` / `study.js`, do not add other
CSS frameworks, and do not restyle the sheet: per-deck tweaks go in a small `<style>` block using the CSS variables listed
in `references/slide-layouts.md`. Working examples to imitate: `examples/kan-explained/` (deck) and
`examples/chain-of-thought/` (annotated paper) in the repository.

## Workflow

### A. Annotate an existing document

1. **Get page images.**
   - PDF: `python scripts/pdf_to_pages.py input.pdf OUT/pages --halves` (needs `pymupdf`). `--halves` splits each page
     into top/bottom images that fill a 16:9 slide and stay readable; omit it for slides or landscape pages.
     The script prints every text block with its position in % — use those numbers for the zones.
   - Web page / HTML: print it to PDF first (headless Chrome: `chrome --headless --print-to-pdf=out.pdf URL`), then as above.
   - PowerPoint / Keynote / Google Slides: export to PDF, then `pdf_to_pages.py` without `--halves`.
2. **Read the document fully** (text from the script output, or the PDF itself) before writing any note.
3. **Create the project:** `python scripts/new_study.py document OUT --title "…"` (copies the engine and the template).
4. **One `<section class="slide page">` per image.** Put marks on 2–6 regions with
   `data-zones="n:x0,y0,x1,y1"` (percent of the image). Add `:box` to draw a pencil box, `:formula` for a purple box
   around an equation, `:green` for a green box; without a suffix only the numbered badge is drawn at the region's corner.
   Add `-r`/`-t`/`-b` to place a box's badge on the right, top or bottom (e.g. `:box-r`) when the left side is busy.
5. **Write the notes** in `<aside class="notes">` with the markup below: one `(n)` block per zone, in reading order.
6. Set `window.STUDY.openSheet = true` so it opens annotated; N shows the clean page.
7. **Check it**: open `index.html?notes#1` in a browser (or headless screenshot) and confirm that every badge sits on
   its region and nothing overflows the sheet. Fix zones by nudging the percentages.

### B. Build a new study deck

1. **Create the project:** `python scripts/new_study.py deck OUT --title "…"`. Outline: sections → slides, one message per slide.
2. Slide content stays **short** (≤ 4 bullets, ≤ 12 words each, figures large). The depth goes into the notes.
3. Mark the elements the notes talk about with `data-n="1"`, `data-n="2"`… top to bottom (2–4 per slide). Panels of an
   image use `data-zones` as above. Wrap at most one phrase per slide in `<span class="hl">` (highlighter, only in N).
4. Write the notes for every slide (see below). Then render and check as in A.7.

Layouts, classes and configuration: `references/slide-layouts.md`. Full notes syntax with examples: `references/notes-syntax.md`.
Annotating documents in depth (zones, page halves, what to explain): `references/annotate-documents.md`.

## Notes markup (inside `<aside class="notes">`)

```
# Title of the sheet
! The key idea of this slide in one sentence (yellow "Key idea" box, max one).
(1) Block linked to the element with data-n="1" / zone 1 (red badge; hover draws an arrow to it).
- bullet        -- sub-bullet
> Source (2024): the claim from the literature that backs this (blue box).
?? Likely question? Short answer (green "If asked" box).
warn: the pitfall people miss (red box).        ex: a concrete example (green box).
f: the formula, written plainly (purple box).    | table | rows |  (first row = header)
→ What comes next (red arrow line, last line).
```
Inline: `**bold**`, `==highlight==`, `*italic*`, `[2]` (small badge pointing to element 2), `x_{i}`, `x^{2}`.

## Writing the explanation — the part that matters

- **Explain, do not paraphrase.** Each `(n)` block says what the element is, how to read it (axes, units, colours, symbols)
  and why it matters. Define every term the first time it appears.
- **One key idea per slide** (`!`), phrased as the sentence a student should remember.
- **Anticipate questions** with `??` and give the short answer you would say aloud.
- **Numbers are sacred**: copy figures exactly from the source; never invent results. If something is your inference, say so.
- **Cite, do not copy**: quote at most a short phrase; summarise in your own words; `>` boxes name the source.
- Keep each sheet to what fits one screen (≈ 8–14 lines of notes). Split into two slides/page halves rather than overflow.
- Match the user's language: set `lang: 'es'` for Spanish UI labels; write the notes in the user's language.
- Style: informal but rigorous, short bullets; no decorative coloured boxes on the slides themselves — colour lives in the sheet.

## Output checklist

- [ ] Folder with `index.html`, `study.css`, `study.js` and the images; opens offline with a double click.
- [ ] Every slide/page has notes; every `(n)` has a matching `data-n` or zone, and vice versa.
- [ ] Rendered at 1920×1080 with `?notes`: badges on target, sheet not overflowing, no text cut off.
- [ ] Tell the user the keys: **N** sheet · **E** edit · **P** presenter · **O** overview · **?** help.
