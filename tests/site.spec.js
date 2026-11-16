import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/", "/privacy/", "/company/", "/404.html"];
const WIDTHS = [375, 1440];

// Collects console errors (including CSP violations), uncaught exceptions and third-party requests.
function watchErrors(page) {
  const errors = [];
  page.on("request", (r) => { if (new URL(r.url()).host !== "127.0.0.1:4173") errors.push(`third-party request: ${r.url()}`); });
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

// The tour dwells 8 s per tab; tests shorten it so they run fast and leave slack.
async function openTour(page, dwell = "1s") {
  await page.goto("/");
  const demo = page.locator("[data-demo]");
  // CSSOM writes are allowed by the CSP; a <style> tag would be blocked.
  await demo.evaluate((el, value) => el.style.setProperty("--tour-dwell", value), dwell);
  await demo.scrollIntoViewIfNeeded();
  return demo;
}

test("tour tabs switch panels by click and keyboard", async ({ page }) => {
  const errors = watchErrors(page);
  const demo = await openTour(page);
  for (const tab of await demo.getByRole("tab").all()) {
    await tab.click();
    await expect(page.locator(`#${await tab.getAttribute("aria-controls")}`)).toBeVisible();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(demo.locator('[role="tabpanel"]:visible')).toHaveCount(1);
  }
  await page.keyboard.press("Home");
  await expect(page.locator("#t-find")).toBeFocused();
  await expect(page.locator("#t-find")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(page.locator("#t-clean")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#t-find")).toHaveAttribute("aria-selected", "true");
  expect(errors).toEqual([]);
});

test("tour advances on its own and stays put while hovered", async ({ page }) => {
  const demo = await openTour(page);
  await page.mouse.move(0, 0);
  await expect(page.locator("#t-ask")).toHaveAttribute("aria-selected", "true", { timeout: 5_000 });
  await demo.locator(".mock").hover();
  const selected = await demo.locator('[aria-selected="true"]').getAttribute("id");
  await page.waitForTimeout(2_500);
  // Read once: a retrying assertion could pass when the tour wraps round to the same tab.
  expect(await demo.locator('[aria-selected="true"]').getAttribute("id")).toBe(selected);
});

test("pause and play buttons stop and resume the tour", async ({ page }) => {
  const demo = await openTour(page);
  const toggle = demo.getByRole("button", { name: /tour$/ });
  await expect(toggle).toHaveText("Pause tour");
  await toggle.click();
  await expect(toggle).toHaveText("Play tour");
  const selected = await demo.locator('[aria-selected="true"]').getAttribute("id");
  await page.mouse.move(0, 0);
  await page.waitForTimeout(2_500);
  // Read once: a retrying assertion could pass when the tour wraps round to the same tab.
  expect(await demo.locator('[aria-selected="true"]').getAttribute("id")).toBe(selected);
  // Play resumes at once, with the pointer and focus still on the button.
  await toggle.click();
  await expect(toggle).toHaveText("Pause tour");
  await expect(demo.locator('[aria-selected="true"]')).not.toHaveAttribute("id", selected, { timeout: 5_000 });
});

test("mobile menu opens, and closes on a link, Escape and a click outside", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  await expect(page.locator(".nav-links")).toBeHidden();
  const menu = page.locator("details.menu");
  const summary = menu.locator("summary");

  await summary.click();
  await page.keyboard.press("Escape");
  await expect(menu).not.toHaveAttribute("open", "");
  await expect(summary).toBeFocused();

  await summary.click();
  await page.locator("h1").click();
  await expect(menu).not.toHaveAttribute("open", "");

  await summary.click();
  await menu.getByRole("link", { name: "Security" }).click();
  await expect(menu).not.toHaveAttribute("open", "");
  await expect(page).toHaveURL(/#trust$/);
});
