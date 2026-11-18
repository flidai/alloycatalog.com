// Writes the :root block of src/assets/site.css from brand/tokens.json.
import { readFileSync, writeFileSync } from "node:fs";

const CSS = "src/assets/site.css";
const tokens = JSON.parse(readFileSync("brand/tokens.json", "utf8"));
const css = readFileSync(CSS, "utf8");

const start = "/* tokens:start: generated from brand/tokens.json by scripts/tokens.mjs, do not edit by hand. */\n";
const end = "/* tokens:end */\n";
const from = css.indexOf(start);
const to = css.indexOf(end);
if (from < 0 || to < from) throw new Error(`${CSS}: token markers not found`);

const lines = Object.entries(tokens.site).map(([name, value]) => `  --${name}: ${value};`);
const block = `:root {\n${lines.join("\n")}\n  color-scheme: ${tokens.colorScheme};\n}\n`;
const next = css.slice(0, from + start.length) + block + css.slice(to);
if (next !== css) writeFileSync(CSS, next);
