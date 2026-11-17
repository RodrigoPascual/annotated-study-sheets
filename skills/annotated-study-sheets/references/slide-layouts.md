# Slide layouts, classes and configuration

Canvas: 1600 × 900 px, scaled to the window. Every slide is a `<section class="slide">` inside `#deck`:

```html
<div id="stage"><div id="deck">
  <section class="slide" data-section="Results" data-title="Main result"> … <aside class="notes"> … </aside></section>
</div></div>
<script>window.STUDY = { … }</script>
<script src="study.js"></script>
```

- `data-section` groups slides; the top bar shows one column per section with one dot per slide (Beamer "Berlin" style).
- `data-title` is the short name used in the sheet breadcrumb, overview and presenter view (defaults to the `<h2>`).

## Slide types

| Class | Use |
|---|---|
| `slide cover` | title slide, no bars: `.left` (h1, `.tagline`, `.author`, `.affil`) + optional `.right` visual |
| `slide chapter` | section divider: `<h2><span class="kicker">Part 2</span>Title</h2>` + `<p class="question">` |
| `slide` | normal content slide: `<header class="head"><h2>…</h2><p class="sub">…</p></header>` + `.content` |
| `slide page` | annotated document page: a single `figure.fig > .frame > img[data-zones]`, no bars |

## Content building blocks

| Markup | Result |
|---|---|
| `.content` | flex row filling the slide (`.content.stack` for a column) |
| `.col`, `.col.wide`, `.col.narrow` | columns inside `.content` |
| `figure.fig > .frame > img` + `figcaption` | zoomable figure (click → viewer with wheel zoom and drag) |
| `.two-figs` | two figures side by side |
| `table.t` (`td.n` right-aligned numbers, `tr.hi` highlighted row) | clean table |
| `.roadmap` with `.stop` (`.current`, `.done`, `.dim`) | the thread of the talk (`style="--n:5"`) |
| `.stats > .stat > .v + .l` | big numbers (`style="--n:3"`) |
| `.callout` | the only boxed element allowed on slides; use sparingly |
| `ul.cols-2` | bullet list in two columns |
| `p.cite` | short source line at the bottom of the slide |
| `.step` | build: appears on the next key press |
| `span.hl` | highlighter sweep, only visible with the sheet open |
| `section[data-widget="name"]` + `window.WIDGETS.name = { init(slide), enter(slide) }` | interactive slide |

## Marks on the slide (drawn when N is pressed)

- `data-n="k"` on any element: a pencil bracket with badge **k** beside text, lists and tables; just the badge on figures.
- `data-mark="box"` (red pencil box), `"formula"` (purple), `"green"`, `"badge"`, `"bracket"`, `"corner"` override the default.
- `img[data-zones="2:0,0,50,48; 3:50,0,100,48:box"]` — regions of an image in % (x0,y0,x1,y1), optional `:box|:formula|:green`.
- Number 1, 2, 3… top-to-bottom, left-to-right; 2–4 marks per slide, 2–6 per document page.

## `window.STUDY` options

| Key | Default | Meaning |
|---|---|---|
| `author` | `''` | left cell of the bottom bar |
| `title` | `document.title` | middle cell of the bottom bar and sheet footer |
| `lang` | `'en'` | `'en'` or `'es'` UI labels (box titles, buttons, help) |
| `hideInBar` | `[]` | section names left out of the top bar (e.g. `['Intro', 'References']`) |
| `short` | `{}` | short names for the section tabs of the sheet |
| `colorize` | `[]` | `[{ match, color }]` terms coloured automatically in the notes |
| `openSheet` | `false` | open with the study sheet already showing (good for annotated documents) |

URL options: `index.html#7` opens slide 7; `index.html?notes#7` opens it with the sheet.

## Theming

Override CSS variables after `study.css`: `--accent`, `--tint`, `--font`, `--bar-top-1/2`, `--bar-foot-1/2/3`,
`--sheet-w` (sheet width), `--s-paper`, `--s-hand` (handwriting font), `--s-red` (badge colour).

## Keys

→ / Space next · ← previous · `12`+Enter go to 12 · **N** study sheet · **E** edit notes · **P** presenter view ·
**O** overview · **F** fullscreen · **B** black screen · **?** help · Ctrl+S save notes to `notes.js`.
