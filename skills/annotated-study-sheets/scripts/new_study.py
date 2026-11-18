"""Start a new HTML study deck with the exact engine and style of this skill.
(To annotate a PDF, use annotate_pdf.py: a PDF becomes an annotated PDF, not HTML.)

Usage:
    python new_study.py deck OUT_DIR [--title "Talk title"] [--author "Name"] [--lang en|es]
    python new_study.py deck --source talk/index.html [--title …]   -> talk-annotated/ (add notes to an existing talk)

With --source the original is never touched: a sibling folder "<name>-annotated/" is created next to it
(or OUT_DIR if given) and a copy of the original goes to "<name>-annotated/source/".

Copies assets/study.css and assets/study.js byte for byte (never rewrite them: they ARE the look —
pencil marks, handwritten sheet, animations) and the matching template as OUT_DIR/index.html.
"""
import argparse
import shutil
from pathlib import Path

ASSETS = Path(__file__).resolve().parent.parent / "assets"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("kind", choices=["deck"])
    ap.add_argument("out", nargs="?", default="")
    ap.add_argument("--source", default="", help="existing HTML talk to add notes to (copied, never modified)")
    ap.add_argument("--title", default="")
    ap.add_argument("--author", default="")
    ap.add_argument("--lang", default="en", choices=["en", "es"])
    a = ap.parse_args()

    src = Path(a.source).resolve() if a.source else None
    if src and not src.exists():
        raise SystemExit(f"Source not found: {src}")
    if src and src.suffix.lower() == ".pdf":
        raise SystemExit("A PDF is annotated as a PDF: use  python annotate_pdf.py init " + str(src))
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
    tpl = (ASSETS / "deck-template.html").read_text(encoding="utf-8")
    if a.title:
        tpl = tpl.replace("TALK TITLE", a.title)
    if a.author:
        tpl = tpl.replace("Author Name · Group", a.author)
    tpl = tpl.replace("lang: 'en'", f"lang: '{a.lang}'").replace('<html lang="en">', f'<html lang="{a.lang}">')
    index = out / "index.html"
    if index.exists():
        raise SystemExit(f"{index} already exists: not overwritten (engine files were refreshed).")
    index.write_text(tpl, encoding="utf-8")
    (out / "figures").mkdir(exist_ok=True)
    print(f"Created {index} with study.css + study.js" + (f"; original copied to {out / 'source'}" if src else "")
          + ". Now fill in the slides and their <aside class=\"notes\">.")


if __name__ == "__main__":
    main()
