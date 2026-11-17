"""Render every page of a PDF to PNG for an annotated study sheet.

Usage:
    python pdf_to_pages.py paper.pdf out_dir/pages [--width 1400] [--first 1] [--last N] [--halves]

--halves cuts every page into a top and a bottom image (page-01a.png, page-01b.png, with a 4 % overlap).
Half pages are landscape, so they fill a 16:9 slide and stay readable next to the study sheet.

Also prints each page's text blocks with their position in % of the page, so the zones
(data-zones="n:x0,y0,x1,y1") can be placed on real paragraphs, figures and equations.
Requires: pip install pymupdf
"""
import argparse
import json
import sys
from pathlib import Path

import pymupdf  # PyMuPDF


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdf")
    ap.add_argument("out")
    ap.add_argument("--width", type=int, default=1400, help="output width in pixels")
    ap.add_argument("--first", type=int, default=1)
    ap.add_argument("--last", type=int, default=0)
    ap.add_argument("--halves", action="store_true", help="split each page into top and bottom halves")
    ap.add_argument("--layout", default="", help="optional JSON file with the text blocks of every page")
    a = ap.parse_args()
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(a.pdf)
    last = a.last or doc.page_count
    layout = {}
    for i in range(a.first - 1, last):
        page = doc[i]
        w, h = page.rect.width, page.rect.height
        zoom = a.width / w
        pix_all = []
        if a.halves:
            for tag, (f0, f1) in (("a", (0.0, 0.52)), ("b", (0.48, 1.0))):
                clip = pymupdf.Rect(0, h * f0, w, h * f1)
                pix_all.append((f"page-{i + 1:02d}{tag}.png", clip, f0, f1))
        else:
            pix_all.append((f"page-{i + 1:02d}.png", page.rect, 0.0, 1.0))
        raw = []
        for b in page.get_text("blocks"):
            text = " ".join(b[4].split())
            if text:
                raw.append((b[0], b[1], b[2], b[3], text[:160]))
        for img in page.get_image_info():
            x0, y0, x1, y1 = img["bbox"]
            raw.append((x0, y0, x1, y1, "[image]"))
        for name, clip, f0, f1 in pix_all:
            page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=clip, alpha=False).save(out / name)
            hh = h * (f1 - f0)
            blocks = []
            for x0, y0, x1, y1, text in raw:
                if y1 < h * f0 or y0 > h * f1:
                    continue
                blocks.append({"zone": [round(100 * x0 / w, 1), round(max(0, 100 * (y0 - h * f0) / hh), 1),
                                        round(100 * x1 / w, 1), round(min(100, 100 * (y1 - h * f0) / hh), 1)], "text": text})
            layout[name] = blocks
            print("\n== " + name)
            for bl in blocks:
                z = bl["zone"]
                print(f"  {z[0]:5.1f},{z[1]:5.1f},{z[2]:5.1f},{z[3]:5.1f}  {bl['text'][:100]}")
    if a.layout:
        Path(a.layout).write_text(json.dumps(layout, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n{last - a.first + 1} pages -> {out}")


if __name__ == "__main__":
    main()
