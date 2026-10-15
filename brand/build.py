"""Generate the Alloy Catalog identity: mark, lockups and favicons.

The mark is an "A" made of two materials. Where they overlap the colour
deepens: the alloy. Text is outlined from IBM Plex Sans so the SVGs render
identically everywhere.

Usage: FONT_DIR=<dir with IBMPlexSans-*.ttf> python brand/build.py
"""
import os
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.environ["FONT_DIR"]

# Geometry on a 100x100 grid: a hexagon cut into metal grains, the
# microstructure of an alloy. Gaps are masked out so the mark works on any
# background.
HEX = "50,10 84.64,30 84.64,70 50,90 15.36,70 15.36,30"
GRAINS = [
    ("50,10 84.64,30 70,42 52,36", "c1"),
    ("52,36 70,42 84.64,30 84.64,70 66,62", "c3"),
    ("15.36,30 50,10 52,36 34,48", "c2"),
    ("34,48 52,36 66,62 50,70", "c4"),
    ("15.36,30 34,48 50,70 30,78 15.36,70", "c3"),
    ("30,78 50,70 66,62 84.64,70 50,90", "c2"),
]

THEMES = {
    "light": {"c1": "#7fb6ee", "c2": "#3f8ad0", "c3": "#0c60a3", "c4": "#082f52", "word": "#18181b", "sub": "#52525b"},
    "dark": {"c1": "#cfe5fb", "c2": "#7fb6ee", "c3": "#3d8fdb", "c4": "#f2f7fd", "word": "#fafafa", "sub": "#a1a1aa"},
}


def mark(t, uid, gap=2.6, classes=False):
    lines = "".join(f'<polygon points="{p}"/>' for p, _ in GRAINS)
    cells = "".join(f'<polygon points="{p}" ' + (f'class="{c}"' if classes else f'fill="{t[c]}"') + '/>'
                    for p, c in GRAINS)
    return (f'<mask id="{uid}"><polygon points="{HEX}" fill="#fff"/>'
            f'<g fill="none" stroke="#000" stroke-width="{gap}" stroke-linejoin="round">{lines}</g></mask>'
            f'<g mask="url(#{uid})">{cells}</g>')


def text_path(word, font_file, size, x, baseline, fill):
    font = TTFont(os.path.join(FONTS, font_file))
    gs, cmap = font.getGlyphSet(), font.getBestCmap()
    scale = size / font["head"].unitsPerEm
    out, cursor = [], 0
    for ch in word:
        name = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[name].draw(pen)
        d = pen.getCommands()
        if d:
            out.append(f'<path transform="translate({x + cursor * scale:.2f} {baseline}) scale({scale:.5f} {-scale:.5f})" d="{d}"/>')
        cursor += gs[name].width
    return f'<g fill="{fill}">{"".join(out)}</g>', cursor * scale


def svg(view_w, view_h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {view_w:.0f} {view_h:.0f}" role="img">'
            f'<title>{title}</title>{body}</svg>\n')


def write(name, content):
    with open(os.path.join(HERE, name), "w") as f:
        f.write(content)


for theme, t in THEMES.items():
    write(f"mark-on-{theme}.svg", svg(100, 100, mark(t, f"a-{theme}"), "Alloy Catalog"))
    # Lockup: mark 100 high, words at cap height ~50.
    size = 72
    alloy, w1 = text_path("Alloy", "IBMPlexSans-SemiBold.ttf", size, 126, 80, t["word"])
    catalog, w2 = text_path("Catalog", "IBMPlexSans-Regular.ttf", size, 126 + w1 + 18, 80, t["sub"])
    write(f"lockup-on-{theme}.svg", svg(126 + w1 + 18 + w2 + 4, 100,
                                         mark(t, f"l-{theme}") + alloy + catalog, "Alloy Catalog"))

# Favicon follows the system theme; wider gaps so the grains survive at 16 px.
light, dark = THEMES["light"], THEMES["dark"]
css = "".join(f".{c}{{fill:{light[c]}}}" for c in ("c1", "c2", "c3", "c4"))
css_dark = "".join(f".{c}{{fill:{dark[c]}}}" for c in ("c1", "c2", "c3", "c4"))
write("favicon.svg", svg(100, 100, f"<style>{css}@media (prefers-color-scheme:dark){{{css_dark}}}</style>"
                         + mark(light, "f", gap=4.5, classes=True), "Alloy Catalog"))
print("ok")

# Social card 1200x630 (light), outlined text only.
t = THEMES["light"]
size = 64
alloy, w1 = text_path("Alloy", "IBMPlexSans-SemiBold.ttf", size, 0, 0, t["word"])
catalog, w2 = text_path("Catalog", "IBMPlexSans-Regular.ttf", size, w1 + 16, 0, t["sub"])
line1, _ = text_path("Every part. Every source.", "IBMPlexSans-SemiBold.ttf", 76, 0, 0, t["word"])
line2, _ = text_path("One catalog.", "IBMPlexSans-SemiBold.ttf", 76, 0, 0, t["c3"])
sub, _ = text_path("Engineering master data with a built-in AI agent", "IBMPlexSans-Regular.ttf", 34, 0, 0, t["sub"])
write("og.svg", svg(1200, 630,
    '<rect width="1200" height="630" fill="#fafafa"/>'
    '<rect x="0" y="618" width="1200" height="12" fill="#0c60a3"/>'
    f'<g transform="translate(80 80) scale(0.9)">{mark(t, "og")}</g>'
    f'<g transform="translate(196 138)">{alloy}{catalog}</g>'
    f'<g transform="translate(80 350)">{line1}</g>'
    f'<g transform="translate(80 446)">{line2}</g>'
    f'<g transform="translate(80 530)">{sub}</g>', "Alloy Catalog"))
print("og ok")
