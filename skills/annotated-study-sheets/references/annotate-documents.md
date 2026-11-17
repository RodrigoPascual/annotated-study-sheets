# Annotating papers, PDFs, web pages and existing slides

## 1. Pages → images

```bash
pip install pymupdf
python scripts/pdf_to_pages.py paper.pdf annotated/pages --halves      # papers, reports (portrait)
python scripts/pdf_to_pages.py slides.pdf annotated/pages               # slide decks (landscape)
```

- `--halves` writes `page-01a.png` (top 52 %) and `page-01b.png` (bottom 52 %). A portrait page shown whole on a 16:9
  slide is too small to read next to the sheet; halves are not. Skip halves that are empty.
- The script prints each text block as `x0,y0,x1,y1  text` in % of that image — copy those numbers into `data-zones`.
  Figures drawn as vectors are not listed; estimate their box from the image.
- Web pages: print to PDF first. Word / PowerPoint: export to PDF.

## 2. One slide per image

```html
<section class="slide page" data-section="Page 2" data-title="Method and equation 3">
  <figure class="fig"><div class="frame">
    <img src="pages/page-02a.png" alt="Page 2, top" data-zones="1:8,10,49,30; 2:51,12,92,20:formula; 3:51,40,92,70:box">
  </div></figure>
  <aside class="notes"> … </aside>
</section>
```

- `data-section` = the paper section or page (it becomes the tab in the sheet); `data-title` = what this half is about.
- Zones: give a few % of margin; badges sit just outside the top-left corner. Use `:box` for the paragraph that carries
  the main claim, `:formula` for equations, plain badges for figures and tables.

## 3. What to explain on each page

1. **What the paper claims** (abstract/introduction): the problem, the method, the headline result — each in one line.
2. **Every equation that matters**: name each symbol, say what the equation does in words, and give the intuition.
3. **Every figure and table**: axes, units, what each colour/line is, the one comparison to look at, the number to remember.
4. **Method choices**: why this design and not the obvious alternative (use `>` if the paper cites a reason).
5. **Limitations and caveats** with `warn:`; **likely exam/meeting questions** with `??`.
6. End each sheet with `→` pointing to the next page.

Keep page numbers, equation numbers and values exactly as in the source. Do not reproduce long passages: explain them.

## 4. Check

Open `index.html?notes#1`, or screenshot headless:

```bash
chrome --headless=new --window-size=1920,1080 --virtual-time-budget=5000 --screenshot=check.png "file:///…/index.html?notes#3"
```

Every badge must sit on its region; the sheet must not need scrolling (split the notes otherwise).
