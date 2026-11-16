// Renders the social card brand/og.svg to src/assets/og.png (1200x630).
// Run after python brand/build.py; CI checks the committed PNG is current.
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";

const png = new Resvg(readFileSync("brand/og.svg"), { fitTo: { mode: "width", value: 1200 } }).render().asPng();
const out = "src/assets/og.png";
const current = (() => { try { return readFileSync(out); } catch { return null; } })();
if (!current || !current.equals(png)) writeFileSync(out, png);
