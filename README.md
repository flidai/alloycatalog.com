# alloycatalog.com

Public website for **Alloy Catalog**, engineering master data with a built-in
AI agent. A product by [Flid](https://flid.ai).

A small [Eleventy](https://www.11ty.dev/) site with plain HTML, CSS and
JavaScript: no framework, bundler or CSS preprocessor. Every push to `main`
is checked and then deployed to GitHub Pages by `.github/workflows/site.yml`.

## Run locally

Needs Node 22 or later (CI uses the version in `.nvmrc`).

```bash
npm ci
npm start          # dev server with live reload
npm run check      # build, validate HTML, size budget and browser tests
```

`npm test` needs a browser once: `npx playwright install --only-shell chromium`.

## Where things live

| Path | What |
|---|---|
| `src/_data/site.json` | Name, domain, contact address, booking link, company details, navigation |
| `src/_includes/` | `base.njk` (head, header, footer) and `page.njk` (text pages) |
| `src/index.njk` | Home page |
| `src/*.md` | Privacy, company and 404 pages |
| `src/assets/` | `site.css`, `site.js`, self-hosted fonts and the social card |
| `brand/` | Logo, favicon and social card sources, and `tokens.json` |
| `tests/` | Playwright smoke and accessibility tests |
| `scripts/` | Token, social card and size budget scripts |

To change the contact address or add a booking link, edit `site.json`: every
button and the footer follow it.

## Checks on every pull request

- HTML validation (`html-validate`) and internal links and anchors (lychee).
- A size budget for the home page's first view: 200 KB, with no third-party
  requests.
- Playwright tests on every page at 375 px and 1440 px:
  - no console or CSP errors;
  - no horizontal overflow;
  - no serious accessibility issues (axe);
  - the product tour and mobile menu work.

Screenshots are kept as a build artifact.

## Brand

The mark is a hexagon cut into metal grains: the microstructure of an alloy.
Colours and design tokens live in `brand/tokens.json`. `npm run build` writes
them into the `:root` block of `site.css`, so edit the JSON, not the CSS.

`brand/build.py` generates the mark, lockups, favicon and social card SVGs.
The text is outlined from the self-hosted IBM Plex fonts. Regenerate them and
the social card PNG with:

```bash
pip install fonttools brotli
python brand/build.py
npm run brand
```

Type: IBM Plex Sans (400/500/600/700) and IBM Plex Mono (400/500), Latin
subset, under the SIL Open Font License (`src/assets/fonts/OFL-*.txt`).

Customer catalogs live at `<company>.alloycatalog.com`; this site is the apex.
