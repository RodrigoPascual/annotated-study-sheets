"""Start a new study deck or annotated document with the exact engine and style of this skill.

Usage:
    python new_study.py deck     OUT_DIR [--title "Talk title"] [--author "Name"] [--lang en|es]
    python new_study.py document --source paper.pdf [--title …] [--author …] [--lang en|es]   -> paper-annotated/
    python new_study.py document OUT_DIR [--title "Paper title"] [--author "Annotated by …"] [--lang en|es]

With --source the original is never touched: a sibling folder "<name>-annotated/" is created next to it
(or OUT_DIR if given) and a read-only copy of the original goes to "<name>-annotated/source/".

Copies assets/study.css and assets/study.js byte for byte (never rewrite them: they ARE the look —
pencil marks, handwritten sheet, animations) and the matching template as OUT_DIR/index.html.
"""
import argparse
import shutil
from pathlib import Path

ASSETS = Path(__file__).resolve().parent.parent / "assets"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("kind", choices=["deck", "document"])
    ap.add_argument("out", nargs="?", default="")
    ap.add_argument("--source", default="", help="original PDF/HTML/PPTX to annotate (copied, never modified)")
    ap.add_argument("--title", default="")
    ap.add_argument("--author", default="")
    ap.add_argument("--lang", default="en", choices=["en", "es"])
    a = ap.parse_args()

    src = Path(a.source).resolve() if a.source else None
    if src and not src.exists():
        raise SystemExit(f"Source not found: {src}")
    if not a.out and not src:
        raise SystemExit("Give OUT_DIR or --source.")
    out = Path(a.out) if a.out else src.with_name(src.stem + "-annotated")
    if src and out.resolve() == src.parent.resolve():
        raise SystemExit("OUT_DIR must not be the folder of the original: use a new '<name>-annotated' folder.")
    out.mkdir(parents=True, exist_ok=True)
    if src:
        (out / "source").mkdir(exist_ok=True)
        dst = out / "source" / src.name
        if not dst.exists():
            shutil.copy2(src, dst)                       # a copy; the original stays exactly as it was
        if not a.title:
            a.title = src.stem.replace("_", " ").replace("-", " ")
    for f in ("study.css", "study.js"):
        shutil.copyfile(ASSETS / f, out / f)
    tpl = (ASSETS / f"{a.kind}-template.html").read_text(encoding="utf-8")
    if a.title:
        tpl = tpl.replace("TALK TITLE", a.title).replace("DOCUMENT TITLE", a.title)
    if a.author:
        tpl = tpl.replace("Author Name · Group", a.author).replace("Annotated by NAME", a.author)
    tpl = tpl.replace("lang: 'en'", f"lang: '{a.lang}'").replace('<html lang="en">', f'<html lang="{a.lang}">')
    index = out / "index.html"
    if index.exists():
        raise SystemExit(f"{index} already exists: not overwritten (engine files were refreshed).")
    index.write_text(tpl, encoding="utf-8")
    (out / ("pages" if a.kind == "document" else "figures")).mkdir(exist_ok=True)
    print(f"Created {index} with study.css + study.js" + (f"; original copied to {out / 'source'}" if src else "")
          + ". Now fill in the slides and their <aside class=\"notes\">.")


if __name__ == "__main__":
    main()
