# Notes syntax

Notes live in `<aside class="notes">` inside each `<section class="slide">`, as plain text, one idea per line.
Indentation is ignored. A blank line closes the current block. The same text is what the user edits with **E**.

| Line starts with | Rendered as |
|---|---|
| `# Title` | blue title with a hand-drawn underline |
| `! text` | **Key idea** — yellow box (one per slide) |
| `(1) text` | block with the red badge **1**; linked to the slide element with `data-n="1"` or zone `1:` |
| `- text` | bullet inside the current block |
| `-- text` | sub-bullet |
| `> text` | **From the literature** — blue box: the source that backs a claim |
| `?? Question? Answer.` | **Check yourself**: self-test box, the question and then the answer, blurred until clicked |
| `warn: text` (or `ojo:`) | **Watch out!** — red box |
| `ex: text` (or `ej:`) | **Example** — green box |
| `f: text` | **Formula** — purple box |
| `\| a \| b \|` | small table; first row is the header; `\|---\|` lines are ignored |
| `→ text` (or `-> text`) | red arrow line: what comes next |

Consecutive lines of the same box type join into one box.

## Inline

`**bold**` · `==highlighter==` · `*italic*` · `[2]` small badge that also draws the arrow to element 2 on hover ·
`x_{i}` subscript · `x^{2}` superscript.

Automatic colouring of recurring terms (e.g. the two methods being compared) with `window.STUDY.colorize`:

```html
<script>window.STUDY = { colorize: [{ match: 'Model A', color: '#0072B2' }, { match: 'Model B', color: '#B07800' }] };</script>
```

## A complete example

```
# Reading the learning-rate figure
! Too small wastes time; too big never converges.

(1) Left panel: tiny steps. The loss goes down but needs thousands of iterations.
- Each dot is one update of w.

(2) Right panel: steps overshoot the valley and the loss explodes.
warn: in practice the symptom is a loss that becomes NaN.
f: w ← w − η · ∇L(w)

| η | Behaviour |
|---|---|
| 0.0001 | slow |
| 1.0 | diverges |
> Kingma & Ba (2015): Adam adapts the step size of every parameter.
?? The loss jumps up and down and never settles. Which way do you change η? Make it smaller: the steps overshoot the minimum.

→ Momentum and Adam.
```

## Good notes, in one paragraph

Explain what each numbered element *is*, how to *read* it and *why* it matters; define jargon on first use; keep numbers
exact; put the single takeaway in `!`; end with one `??` self-test question (apply, compare, predict, explain why) whose answer follows the first `? `;
cite with `>` instead of copying text. Aim for 8–14 lines per slide so the sheet fits one screen.
