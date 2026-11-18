#!/usr/bin/env python3
"""Annotated study copy of a PDF: original page | notes page, as a new PDF. The original is never modified.

    python annotate_pdf.py init paper.pdf [--lang es] [--pages 1-9]   # -> paper-annotated/ (copy, engine, notes/)
    python annotate_pdf.py anchors paper-annotated 3 [--lines] [--find "Table 2"] [--png]
    python annotate_pdf.py build paper-annotated -p 3 --png             # one spread -> paper-annotated/review/
    python annotate_pdf.py build paper-annotated                        # all -> paper-annotated/paper-annotated.pdf

`init` makes  paper-annotated/
                source/paper.pdf        a copy of the original (the only file the build reads)
                studysheet.sty          the engine: look, marks and layout (do not edit)
                main.tex                page size, sections, footer, language
                notes/p01.tex ...       one file per page: marks on the original + the notes blocks  <- write these
                source/text.txt         the text of every page, to read the document
`anchors` prints the position (mm from the page's top-left corner) of every text block, line, image and
figure on a page: the numbers that the marks and \\block[y=...] use.
`build` compiles with LuaLaTeX (TeX Live or MiKTeX) and reports errors, OVERFLOW (a notes block below the
page), missing glyphs and how much of each notes page is used. A clean report ends in OK.
Needs: pip install pymupdf, and lualatex on PATH.
"""
from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    import pymupdf
except ImportError:  # older PyMuPDF
    import fitz as pymupdf  # type: ignore

HERE = Path(__file__).resolve().parent
ENGINE = HERE.parent / "assets" / "pdf" / "studysheet.sty"
MM = 25.4 / 72

MAIN = r"""%% main.tex: annotated study copy of {name}
%% Build: python <skill>/scripts/annotate_pdf.py build "{folder}"
%% Edit the sections (pills in the header), the footer and the language here; write the notes in notes/pNN.tex.
\documentclass{{article}}
\usepackage[paperwidth={pw:.3f}mm, paperheight={h:.3f}mm, margin=0pt]{{geometry}}
\usepackage[{lang}]{{studysheet}}
\StudyPDF{{source/{name}}}
\StudyPageSize{{{w:.3f}}}{{{h:.3f}}}
\StudyTotal{{{total}}}
\StudyBracketX{{{bx:.1f}}}
%% key/Label pairs, in reading order; each notes file lights up its own with \insection{{key,...}}
\StudySections{{{sections}}}
\StudyFooter{{{footer}}}
\pagestyle{{empty}}\setlength\parindent{{0pt}}\setlength\parskip{{0pt}}\setlength\topskip{{0pt}}
\InputIfFileExists{{selection}}{{}}{{\def\studyselection{{{pages}}}}}
\begin{{document}}
\expandafter\StudyPages\expandafter{{\studyselection}}
\end{{document}}
"""

STUB = r"""%% Page {n} of {name}. Positions: annotate_pdf.py anchors <folder> {n}   (mm from the page's top-left corner)
\crumbs{{Section \,›\, what this page covers}}
\insection{{}}

%% ---- marks on the original page
%% \bracket{{1}}{{y0}}{{y1}}   \badge{{2}}{{x}}{{y}}   \highlight{{x0}}{{y0}}{{x1}}{{y1}}   \pencilbox[maths]{{x0}}{{y0}}{{x1}}{{y1}}

\block[y=40]{{%
\num{{1}}\ Explain what is beside this block, in your own words.}}
"""


def pages_spec(spec: str | None, total: int) -> list[int]:
    if not spec:
        return list(range(1, total + 1))
    out: list[int] = []
    for part in spec.split(","):
        a, _, b = part.strip().partition("-")
        out += list(range(int(a), int(b or a) + 1))
    return sorted({p for p in out if 1 <= p <= total})


def source_pdf(folder: Path) -> Path:
    pdfs = sorted((folder / "source").glob("*.pdf"))
    if len(pdfs) != 1:
        sys.exit(f"expected exactly one PDF in {folder / 'source'}, found {len(pdfs)}")
    return pdfs[0]


def tex_escape(s: str) -> str:
    return re.sub(r"([&%$#_{}])", r"\\\1", s)


def cmd_init(a: argparse.Namespace) -> int:
    src = Path(a.source).resolve()
    if not src.is_file() or src.suffix.lower() != ".pdf":
        sys.exit("init needs a PDF. Export Word/PowerPoint/web pages to PDF first (into the -annotated folder).")
    out = Path(a.out).resolve() if a.out else src.with_name(src.stem + "-annotated")
    if out == src.parent:
        sys.exit("the output folder cannot be the original's folder")
    if (out / "main.tex").exists():
        sys.exit(f"{out} already has a main.tex; refusing to overwrite it")
    (out / "source").mkdir(parents=True, exist_ok=True)
    (out / "notes").mkdir(exist_ok=True)
    copy = out / "source" / src.name
    shutil.copy2(src, copy)  # the original stays untouched; everything reads the copy
    shutil.copy2(ENGINE, out / "studysheet.sty")
    doc = pymupdf.open(copy)
    total = len(doc)
    w, h = doc[0].rect.width * MM, doc[0].rect.height * MM
    # right edge of the text column -> where the numbered brackets go
    rights = sorted(b[2] * MM for pg in doc for b in pg.get_text("blocks") if (b[2] - b[0]) * MM > 40)
    edge = rights[int(len(rights) * .95)] if rights else w * .85
    bx = min(edge + 3.0, w - 10.0)
    pages = pages_spec(a.pages, total)
    title = a.title or (doc.metadata or {}).get("title") or src.stem
    foot = (f"{title} · annotated study copy · numbers as printed in the original" if a.lang == "en" else
            f"{title} · copia de estudio anotada · los números van como en el original")
    (out / "main.tex").write_text(MAIN.format(
        name=src.name, folder=out.name, pw=2 * w, w=w, h=h, lang=a.lang, total=total, bx=bx,
        sections="all/" + ("Document" if a.lang == "en" else "Documento"),
        footer=tex_escape(foot), pages=",".join(map(str, pages))), encoding="utf-8")
    for n in pages:
        p = out / "notes" / f"p{n:02d}.tex"
        if not p.exists():
            p.write_text(STUB.format(n=n, name=src.name), encoding="utf-8")
    with open(out / "source" / "text.txt", "w", encoding="utf-8") as f:
        for i, pg in enumerate(doc, 1):
            f.write(f"===== PAGE {i} =====\n{pg.get_text()}\n")
    print(f"created {out}")
    print(f"  original copied to source/{src.name} (the original file was not modified)")
    print(f"  {total} pages, {w:.1f} x {h:.1f} mm; brackets at x = {bx:.1f} mm; notes stubs for pages {a.pages or 'all'}")
    print("  next: read source/text.txt, edit main.tex (sections), then write notes/pNN.tex page by page")
    return 0


def box(r) -> str:
    x0, y0, x1, y1 = (v * MM for v in r)
    return f"y {y0:6.1f}-{y1:6.1f}  x {x0:6.1f}-{x1:6.1f}"


def cmd_anchors(a: argparse.Namespace) -> int:
    folder = Path(a.folder).resolve()
    doc = pymupdf.open(source_pdf(folder))
    pg = doc[a.page - 1]
    print(f"page {a.page}/{len(doc)}: {pg.rect.width * MM:.1f} x {pg.rect.height * MM:.1f} mm "
          f"(mm from the top-left corner; y grows downwards)")
    for b in pg.get_text("dict")["blocks"]:
        if b["type"] == 1:
            print(f"IMG  {box(b['bbox'])}")
            continue
        lines = b.get("lines", [])
        if not lines:
            continue
        text = " ".join("".join(s["text"] for s in ln["spans"]).strip() for ln in lines)
        size = lines[0]["spans"][0]["size"] if lines[0]["spans"] else 0
        print(f"TXT  {box(b['bbox'])}  [{size:4.1f}pt, {len(lines):2d} lines] {text[:110]}")
        if a.lines:
            for ln in lines:
                t = "".join(s["text"] for s in ln["spans"]).strip()
                print(f"       · {box(ln['bbox'])}  {t[:90]}")
    try:
        clusters = pg.cluster_drawings()
    except Exception:
        clusters = []
    for r in clusters:
        if r.width * MM > 15 and r.height * MM > 8:
            print(f"DRAW {box(r)}  (vector drawing: figure, table or rules)")
    for q in a.find:
        hits = pg.search_for(q)
        print(f"FIND {q!r}: " + ("; ".join(box(h) for h in hits) if hits else "not found"))
    if a.png:
        out = folder / "review" / f"orig_p{a.page:02d}.png"
        out.parent.mkdir(exist_ok=True)
        pg.get_pixmap(dpi=130).save(str(out))
        print("png:", out)
    return 0


def cmd_build(a: argparse.Namespace) -> int:
    folder = Path(a.folder).resolve()
    src = source_pdf(folder)
    total = len(pymupdf.open(src))
    have = sorted(int(p.stem[1:]) for p in (folder / "notes").glob("p*.tex") if p.stem[1:].isdigit())
    full = a.pages is None
    pages = pages_spec(a.pages, total) if a.pages else (have or list(range(1, total + 1)))
    if not shutil.which("lualatex"):
        sys.exit("lualatex not found: install TeX Live (tug.org/texlive) or MiKTeX, then run again")
    stage = Path(tempfile.mkdtemp(prefix="ss_"))  # short path: TeX on Windows dislikes long ones
    try:
        for name in ("main.tex", "studysheet.sty"):
            shutil.copy2(folder / name, stage / name)
        shutil.copytree(folder / "notes", stage / "notes")
        (stage / "source").mkdir()
        shutil.copy2(src, stage / "source" / src.name)
        (stage / "selection.tex").write_text("\\def\\studyselection{" + ",".join(map(str, pages)) + "}\n",
                                             encoding="utf-8")
        subprocess.run(["lualatex", "-interaction=nonstopmode", "-file-line-error", "main.tex"], cwd=stage,
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
        log_p = stage / "main.log"
        if not log_p.exists():
            sys.exit("LuaLaTeX did not start (no log)")
        log = log_p.read_text(encoding="utf-8", errors="replace")
        (folder / "review").mkdir(exist_ok=True)
        shutil.copy2(log_p, folder / "review" / "build.log")
        flat = re.sub(r"\n\(studysheet\)\s*", " ", log)
        errors = [ln for ln in log.splitlines() if re.match(r"^(! |.*\.tex:\d+: )", ln)]
        overflows = re.findall(r"OVERFLOW page (\d+): block (\d+) ends at ([\d.]+) mm \(limit ([\d.]+)\)", flat)
        missing = sorted(set(re.findall(r"Missing character: There is no (.+?) in font", log)))
        wide = [float(x) for x in re.findall(r"Overfull \\hbox \(([\d.]+)pt too wide", log)]
        blocks = re.findall(r"SS-BLOCK page (\d+) block (\d+): top ([\d.]+) bot ([\d.]+) limit ([\d.]+)", log)
        print(f"pages built     : {len(pages)} ({pages[0]}..{pages[-1]})")
        print(f"errors          : {len(errors)}")
        for e in errors[:15]:
            print("   ", e)
        print(f"overflows       : {len(overflows)}")
        for p, b, y, lim in overflows:
            print(f"    page {p}: block {b} ends at {y} mm (limit {lim}) -> cut text or split the block")
        print(f"missing glyphs  : {len(missing)} {missing[:10]}")
        print(f"overfull lines  : {sum(1 for v in wide if v > 1)} (max {max(wide) if wide else 0:.1f} pt)")
        used: dict[str, list[float]] = {}
        for p, _, top, bot, lim in blocks:  # text actually written, as a share of the notes area
            u = used.setdefault(p, [0.0, float(lim)])
            u[0] += float(bot) - float(top)
        if used:
            print("notes page full : " + ", ".join(f"p{p}:{100 * t / (l - 31):.0f}%" for p, (t, l) in used.items())
                  + "   (aim for 45-75 %; leave room for the reader's own notes)")
        pdf = stage / "main.pdf"
        if not pdf.exists():
            print("no PDF produced")
            return 2
        stem = src.stem + "-annotated"
        if full:
            dest = folder / f"{stem}.pdf"
            shutil.copy2(pdf, dest)
            two_page(dest, folder / f"{stem}-two-page.pdf")
            print(f"-> {dest.name}  (spreads)  and  {stem}-two-page.pdf  (original, notes, original, notes...)")
        else:
            dest = folder / "review" / f"partial_{re.sub(r'[^0-9-]', '_', a.pages)}.pdf"
            dest.parent.mkdir(exist_ok=True)
            shutil.copy2(pdf, dest)
            print("->", dest.relative_to(folder))
        if a.png or a.zoom:
            doc = pymupdf.open(pdf)
            (folder / "review").mkdir(exist_ok=True)
            for i, n in enumerate(pages):
                pg = doc[i]
                if a.png:
                    pg.get_pixmap(dpi=a.dpi).save(str(folder / "review" / f"p{n:02d}.png"))
                if a.zoom:
                    r = pg.rect
                    pg.get_pixmap(dpi=150, clip=pymupdf.Rect(r.width / 2, 0, r.width, r.height)).save(
                        str(folder / "review" / f"p{n:02d}_notes.png"))
            print("png in review/")
        clean = not errors and not overflows and not missing and not any(v > 1 for v in wide)
        print("OK" if clean else "CHECK")
        return 0 if clean else 3
    finally:
        shutil.rmtree(stage, ignore_errors=True)


def two_page(src: Path, dest: Path) -> None:
    """Split every spread: original, notes, original, notes... (for A4 printing or two-page view)."""
    s = pymupdf.open(src)
    d = pymupdf.open()
    for i in range(len(s)):
        r = s[i].rect
        w, h = r.width / 2, r.height
        for x0 in (0, w):
            pg = d.new_page(width=w, height=h)
            pg.show_pdf_page(pg.rect, s, i, clip=pymupdf.Rect(x0, 0, x0 + w, h))
    try:
        d.set_pagelayout("TwoPageLeft")
    except Exception:
        pass
    d.save(str(dest), garbage=3, deflate=True)


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    i = sub.add_parser("init", help="create <name>-annotated/ next to the PDF")
    i.add_argument("source")
    i.add_argument("--out", help="output folder (default: <name>-annotated next to the original)")
    i.add_argument("--lang", choices=["en", "es"], default="en")
    i.add_argument("--pages", help="pages to annotate, e.g. 1-9 (default: all)")
    i.add_argument("--title")
    n = sub.add_parser("anchors", help="positions on page N, in mm from its top-left corner")
    n.add_argument("folder")
    n.add_argument("page", type=int)
    n.add_argument("--lines", action="store_true")
    n.add_argument("--find", action="append", default=[])
    n.add_argument("--png", action="store_true")
    b = sub.add_parser("build", help="compile (all pages with notes, or -p N)")
    b.add_argument("folder")
    b.add_argument("-p", "--pages")
    b.add_argument("--png", action="store_true")
    b.add_argument("--zoom", action="store_true")
    b.add_argument("--dpi", type=int, default=100)
    a = ap.parse_args()
    return {"init": cmd_init, "anchors": cmd_anchors, "build": cmd_build}[a.cmd](a)


if __name__ == "__main__":
    sys.exit(main())
