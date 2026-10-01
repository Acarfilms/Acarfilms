"""Builds scripts/fonts.json: static Inter instances subset to Latin, as base64
WOFF2 plus per-character advance widths so build.mjs can measure text.

Inter is licensed under the SIL Open Font License 1.1.

    curl -LO "https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz,wght%5D.ttf"
    pip install fonttools brotli
    python scripts/fonts.py "Inter[opsz,wght].ttf"
"""

import base64
import io
import json
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

# Text cut for small sizes, Display cut for headlines (Inter's optical size axis).
INSTANCES = {
    "text-400": {"opsz": 14, "wght": 400},
    "text-500": {"opsz": 14, "wght": 500},
    "text-600": {"opsz": 14, "wght": 600},
    "display-600": {"opsz": 32, "wght": 600},
    "display-700": {"opsz": 32, "wght": 700},
}
CHARS = "".join(chr(c) for c in range(0x20, 0x7F)) + "·—–’′°↗•…"


def build(source: Path) -> dict:
    fonts = {}
    for name, axes in INSTANCES.items():
        font = instantiateVariableFont(TTFont(source), axes)
        options = subset.Options()
        options.flavor = "woff2"
        options.layout_features = ["kern"]  # drops alternates no card uses
        options.hinting = False
        options.name_IDs = [1, 2]
        subsetter = subset.Subsetter(options)
        subsetter.populate(text=CHARS)
        subsetter.subset(font)

        upm = font["head"].unitsPerEm
        cmap = font.getBestCmap()
        advance = {ch: round(font["hmtx"][cmap[ord(ch)]][0] / upm, 4) for ch in CHARS if ord(ch) in cmap}

        buffer = io.BytesIO()
        font.flavor = "woff2"
        font.save(buffer)
        fonts[name] = {"woff2": base64.b64encode(buffer.getvalue()).decode(), "advance": advance}
        print(f"  {name}: {len(buffer.getvalue()) / 1024:.1f} KB")
    return fonts


if __name__ == "__main__":
    out = Path(__file__).with_name("fonts.json")
    out.write_text(json.dumps(build(Path(sys.argv[1]))))
