"""Start a new study deck or annotated document with the exact engine and style of this skill.

Usage:
    python new_study.py deck     OUT_DIR [--title "Talk title"] [--author "Name"] [--lang en|es]
    python new_study.py document OUT_DIR [--title "Paper title"] [--author "Annotated by …"] [--lang en|es]

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
    ap.add_argument("out")
    ap.add_argument("--title", default="")
    ap.add_argument("--author", default="")
    ap.add_argument("--lang", default="en", choices=["en", "es"])
    a = ap.parse_args()

    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
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
    print(f"Created {index} with study.css + study.js. Now fill in the slides and their <aside class=\"notes\">.")


if __name__ == "__main__":
    main()
