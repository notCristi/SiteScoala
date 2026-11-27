#!/usr/bin/env python3
"""
Subset the self-hosted web fonts (public/fonts/*.woff2) to what the site sets.

- Characters: Basic Latin, Latin-1, Latin Extended-A, Romanian comma-below Ș ș Ț ț, typographic quotes and
  dashes („ “ ” ‘ ’ – — …), · ¶ § ° € № ™ − × → ← ≤ ≥ ≈ and figures.
- OpenType features kept: kern, liga, locl, ccmp, mark/mkmk, case, lnum/onum/pnum/tnum (lining + old-style
  figures), smcp/c2sc (small caps). Dropped: swsh, hist, ss01, frac, sups.
- EB Garamond: the weight axis is limited to 400–700 (the weights the design uses); the italic is a static 400.

Needs: pip install fonttools brotli   ·   Usage: python3 scripts/brand/subset-fonts.py
Idempotent: running it on already-subset files changes nothing visible.
"""
import io
import os
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'fonts')
UNICODES = (
    list(range(0x20, 0x7F)) + list(range(0xA0, 0x180)) + list(range(0x218, 0x21C))
    + [0x2013, 0x2014, 0x2018, 0x2019, 0x201A, 0x201C, 0x201D, 0x201E, 0x2022, 0x2026, 0x2032, 0x2033,
       0x2039, 0x203A, 0x20AC, 0x2116, 0x2122, 0x2190, 0x2192, 0x2212, 0x2248, 0x2264, 0x2265]
)
FEATURES = ['kern', 'liga', 'locl', 'ccmp', 'mark', 'mkmk', 'case', 'lnum', 'onum', 'pnum', 'tnum', 'smcp', 'c2sc']
FONTS = {
    'eb-garamond.woff2': (400, 700),
    'eb-garamond-italic.woff2': 400,  # italic is only set at regular weight: a static instance, half the bytes
    'atkinson-next.woff2': None,
}

for name, wght in FONTS.items():
    path = os.path.join(ROOT, name)
    before = os.path.getsize(path)
    font = TTFont(path)
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = FEATURES
    opts.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]  # keep copyright/licence names (OFL)
    opts.notdef_outline = True
    opts.hinting = False
    opts.desubroutinize = True
    s = subset.Subsetter(opts)
    s.populate(unicodes=UNICODES)
    s.subset(font)
    if wght and 'fvar' in font:
        buf = io.BytesIO()
        font.flavor = None
        font.save(buf)
        buf.seek(0)
        font = instancer.instantiateVariableFont(TTFont(buf), {'wght': wght})
    font.flavor = 'woff2'
    font.save(path)
    print(f'{name:28} {before / 1024:6.1f} KB -> {os.path.getsize(path) / 1024:6.1f} KB')
