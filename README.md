# alloycatalog.com

Public website for **Alloy Catalog**, engineering master data with a built-in
AI agent. A product by [Flid](https://flid.ai).

Plain HTML and CSS, no build step. GitHub Pages serves `site/` on every push
to `main` (`.github/workflows/pages.yml`).

## Run locally

```bash
python3 -m http.server 8000 --directory site
```

## Brand

The mark is a hexagon cut into metal grains: the microstructure of an alloy.
`brand/build.py` generates every SVG (mark, lockups, favicon, social card) with
text outlined from IBM Plex Sans:

```bash
FONT_DIR=/path/to/ibm-plex/truetype python brand/build.py
```

Copy the results into `site/` and `site/brand/` after regenerating.

| Token | Light | Dark |
|---|---|---|
| Ink (accent) | `#0c60a3` | `#7fb6ee` |
| Grain light | `#7fb6ee` | `#cfe5fb` |
| Grain mid | `#3f8ad0` | `#7fb6ee` |
| Alloy (deep) | `#082f52` | `#f2f7fd` |

Type: IBM Plex Sans (400/500/600) and IBM Plex Mono.

Customer catalogs live at `<company>.alloycatalog.com`; this site is the apex.
