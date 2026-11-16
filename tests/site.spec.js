import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/", "/privacy/", "/company/", "/404.html"];
const WIDTHS = [375, 1440];

// Collects console errors (including CSP violations) and uncaught exceptions.
function watchErrors(page) {
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

for (const path of PAGES) {
  for (const width of WIDTHS) {
    test(`${path} at ${width}px: no errors, no overflow, no serious axe issues`, async ({ page }, info) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width, height: 900 });
      const errors = watchErrors(page);
      await page.goto(path, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      expect(errors).toEqual([]);
      expect(await page.evaluate(() => document.fonts.check('16px "IBM Plex Sans"'))).toBe(true);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);

      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      const serious = violations.filter((v) => ["serious", "critical"].includes(v.impact));
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);

      await page.screenshot({ path: info.outputPath(`${path.replace(/\W+/g, "-")}${width}.png`), fullPage: true });
    });
  }
}

test("tour tabs switch panels and the pause button works", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/");
  const demo = page.locator("[data-demo]");
  await demo.scrollIntoViewIfNeeded();
  for (const tab of await demo.getByRole("tab").all()) {
    await tab.click();
    const panel = page.locator(`#${await tab.getAttribute("aria-controls")}`);
    await expect(panel).toBeVisible();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(demo.locator('[role="tabpanel"]:visible')).toHaveCount(1);
  }
  // A tab click pauses autoplay; the button resumes and pauses it again.
  const toggle = demo.getByRole("button", { name: /tour/ });
  await expect(toggle).toHaveText("Play tour");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await toggle.click();
  await expect(toggle).toHaveText("Pause tour");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveText("Play tour");
  expect(errors).toEqual([]);
});

test("tour advances on its own", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-demo]").scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(page.locator("#t-ask")).toHaveAttribute("aria-selected", "true", { timeout: 12_000 });
});

test("mobile menu opens and closes after a link is chosen", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  await expect(page.locator(".nav-links")).toBeHidden();
  const menu = page.locator("details.menu");
  await menu.locator("summary").click();
  await expect(menu.getByRole("link", { name: "Security" })).toBeVisible();
  await menu.getByRole("link", { name: "Security" }).click();
  await expect(menu).not.toHaveAttribute("open", "");
  await expect(page).toHaveURL(/#trust$/);
});
