# Annotating a PDF (paper, article, report, exported slides) → annotated PDF

The result is a **new PDF**, `<name>-annotated.pdf`: every page is a spread, the **original page on the left,
untouched** (marks drawn on top of it), and a **notes page on the right** on dotted paper, in handwriting, whose blocks
sit at the height of what they explain. A second file, `<name>-annotated-two-page.pdf`, has the same pages one after the
other (original, notes, original, notes…) for A4 printing or two-page view.
Worked example: `examples/chain-of-thought-annotated/` (`notes/p01.tex` … `p06.tex`).

Needs `pip install pymupdf` and LuaLaTeX (TeX Live or MiKTeX; `lualatex` on PATH).
Word, PowerPoint, Keynote, Google Slides, web pages: export/print to PDF first (inside the `-annotated` folder).

## 1. Create the copy

```bash
python scripts/annotate_pdf.py init paper.pdf --lang en      # --lang es for Spanish labels; --pages 1-9 to limit
```

Creates `paper-annotated/` next to the original (the original file is never modified):

| File | What it is |
|---|---|
| `source/paper.pdf` | copy of the original: the only file the build reads |
| `source/text.txt` | the text of every page — read it all before writing |
| `studysheet.sty` | the engine (look, marks, layout). **Do not edit** |
| `main.tex` | page size, bracket position, sections, footer, language — edit only `\StudySections` and `\StudyFooter` |
| `notes/pNN.tex` | one per page: marks on the original + notes blocks. **This is what you write** |

## 2. Per page: anchors → notes → build → look

```bash
python scripts/annotate_pdf.py anchors paper-annotated 3 --png          # blocks, figures; review/orig_p03.png
python scripts/annotate_pdf.py anchors paper-annotated 3 --lines        # every line with its box
python scripts/annotate_pdf.py anchors paper-annotated 3 --find "Table 2" --find "state of the art"
python scripts/annotate_pdf.py build   paper-annotated -p 3 --png       # review/p03.png (whole spread)
python scripts/annotate_pdf.py build   paper-annotated                  # all pages -> paper-annotated.pdf
```

All positions are **mm from the top-left corner of the original page** (y grows downwards), exactly as `anchors`
prints them. The build report must end in `OK` (no errors, no OVERFLOW, no missing glyphs). It also prints how full
each notes page is: aim for 45–75 %, so the reader keeps room for their own notes. **Open `review/pNN.png` every time**
and check that every mark lands on its target and the notes are not crowded.

## 3. A notes file

```latex
\crumbs{§3 Method \,›\, Equation~2 \,›\, Figure~4}   % breadcrumb under the header
\insection{method}                                     % which pill(s) of \StudySections light up

%% marks on the original page (from anchors)
\bracket{1}{40.8}{86.5}              % paragraph group: bracket + badge 1 in the right margin
\bracket[maths]{2}{96.9}{103.3}      % purple badge for an equation
\badge{3}{32.5}{128.0}               % badge anywhere (left margin, beside a figure panel "(a)")
\highlight{66.2}{32.4}{147.5}{36.0}  % 2-4 key phrases per page (hlyellow; hlgreen, hlblue, hlpink)
\pencilbox[maths]{22.5}{96.9}{109.8}{103.3}   % hand-drawn box: an equation, a key number, a table cell
\ring{158.0}{75.4}{161.5}{78.9}      % ellipse around a small item (a number in a figure)
\penunderline{73.5}{147.0}{146.9}    % x0 x1 y(bottom of the line)
\margintext{185}{60}{key!}           % a word in the margin (rarely)

\block[y=40]{%                        % y = top of what it explains; never overlaps the block above
\num{1}\ \textbf{What it says}: plain words, then why it matters.
\begin{points}
  \item one point \item another
\end{points}}

\block[y=96]{%
\begin{formula}[{\num[maths]{2}\ Eq.~(2)}]
$g(\mathbf z)=\sigma(f_\theta(\mathbf z))$: each symbol, then the intuition.
\end{formula}}

\block[x=0, w=92]{left half}          % two blocks side by side: x/w in mm (full width = \NotesWidth)
\block[x=97, w=92.9, side]{right half}
\arrowto{b3}{120}{140}               % pen arrow from block 3 (or name=...) to a point of the original (rarely)
```

Block options: `y` (desired top, mm), `x`, `w` (mm), `side` (same top as the previous block), `name`, `gap`.
`\room{20}` keeps 20 mm free below the last block.

Inside blocks: `\heading{…}` (hand-underlined title), `\sub{…}`, lists `points`, `arrows`, `steps`; boxes `keyidea`,
`warning`, `example`, `formula`, `summary`, `question` (each takes an optional title: `\begin{example}[Toy numbers]`);
`smalltable{cols}` with booktabs `\midrule`; colours `\red{}` `\green{}` `\blue{}` `\amber{}` `\teal{}` `\orange{}`
`\purple{}` `\grey{}`; `\hl{…}` / `\hl[hlgreen]{…}` highlighter; `\orig{…}` = a term exactly as printed in the original
(grey); `\num{n}` badge. Maths: normal `$…$` (unicode-math, STIX Two). Icons: fontawesome5 (`\faCheck`, `\faTimes`).
Small TikZ sketches are welcome (`boxblue`, `boxamber`, `boxgreen`, `boxorange`, `boxgrey`, `tinyarrow`, `pencil`).
Colour-code recurring concepts consistently across the document (define them once in `main.tex` if needed, e.g.
`\newcommand\modelA{\blue{\textbf{Model A}}}`).

## 4. What to explain on each page

1. **Top to bottom, in the page's order**: every section, paragraph group, figure (each panel), table, equation,
   definition — numbered 1, 2, 3… on the page and in the notes.
2. **A figure**: what it shows, how to read it (axes, units, colours, markers, panels), the one comparison to look at.
   **A table**: what rows and columns are, the 1–3 numbers that matter. **An equation**: each symbol, the intuition,
   and a tiny worked example with round toy numbers when it helps (label it as a toy example).
3. One `keyidea` (at most two) per page; a `question` ("If someone asks") only where a reviewer or examiner would
   really ask; `warning` for easy confusions.
4. **Numbers exactly as printed** on the left page. Never invent or recompute results. Cite other pages as "Table 2, page 12".
5. Explain, do not translate or copy: short sentences, simple words, define every term the first time.
6. References pages: group them by role and say in a few words why the key ones matter.

## 5. Fonts and requirements

Segoe Print / Segoe UI on Windows; elsewhere Comic Neue / Fira Sans (both ship with TeX Live). Force another
handwriting font with `\StudyHandFont{Font Name}` in `main.tex`. Long Windows paths are handled by the build script
(it compiles in a short temporary folder).
