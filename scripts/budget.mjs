// Fails the build when the home page's first view gets too heavy, or when
// placeholder text reaches the output. Text files count gzipped, as served.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const OUT = "_site";
const LIMIT = 200 * 1024;
const html = readFileSync(join(OUT, "index.html"), "utf8");

const local = new Set(["/index.html"]);
for (const [, url] of html.matchAll(/<(?:link|script|img)\b[^>]*?\b(?:href|src)="(\/[^"#?]*)/g)) local.add(url);
for (const [, url] of readFileSync(join(OUT, "assets/site.css"), "utf8").matchAll(/url\("(fonts\/[^"]+)"\)/g)) local.add(`/assets/${url}`);

let total = 0;
for (const url of local) {
  const file = readFileSync(join(OUT, url));
  const bytes = /\.(html|css|js|svg|json|txt|xml)$/.test(url) ? gzipSync(file).length : file.length;
  total += bytes;
  console.log(`${(bytes / 1024).toFixed(1).padStart(7)} KB  ${url}`);
}
console.log(`${(total / 1024).toFixed(1).padStart(7)} KB  total (limit ${LIMIT / 1024} KB)`);

const walk = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
const placeholders = walk(OUT).filter((f) => /\.(html|xml|txt)$/.test(f) && /\bTODO\b/.test(readFileSync(f, "utf8")));

if (total > LIMIT) { console.error("First view is over budget."); process.exit(1); }
if (placeholders.length) { console.error(`Placeholder text in: ${placeholders.join(", ")}`); process.exit(1); }
