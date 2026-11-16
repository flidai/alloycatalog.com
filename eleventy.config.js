import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export default function (config) {
  config.addPassthroughCopy({
    "src/assets": "assets",
    "src/.nojekyll": ".nojekyll",
    "src/CNAME": "CNAME",
    "src/favicon.svg": "favicon.svg",
    "src/favicon-32.png": "favicon-32.png",
    "src/apple-touch-icon.png": "apple-touch-icon.png",
    "brand/lockup-on-dark.svg": "brand/lockup-on-dark.svg",
    "brand/lockup-on-light.svg": "brand/lockup-on-light.svg",
    "brand/mark-on-dark.svg": "brand/mark-on-dark.svg",
    "brand/mark-on-light.svg": "brand/mark-on-light.svg",
  });
  config.addWatchTarget("src/assets/");

  // Cache-busting query string from the file's content.
  config.addFilter("v", (path) => {
    const hash = createHash("sha256").update(readFileSync(`src${path}`)).digest("hex").slice(0, 8);
    return `${path}?v=${hash}`;
  });

  config.addGlobalData("isBuild", process.env.ELEVENTY_RUN_MODE === "build");

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
