import { expect, test } from "@playwright/test";
import { PAGES } from "../../scripts/page-map.mjs";
import site from "../../src/content/legacy/site.json";

const ROUTES = [...PAGES.map((p) => p.route), "/photo-album"];

for (const route of ROUTES) {
  test(`${route}: loads, no sideways scrolling, all images load`, async ({ page }) => {
    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "page wider than screen").toBeLessThanOrEqual(0);

    const srcs = await page.locator("main img").evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).src));
    for (const src of new Set(srcs)) {
      const r = await page.request.get(src);
      expect(r.status(), src).toBe(200);
    }
  });
}

test("every link inside the site leads to a working page", async ({ page }) => {
  test.setTimeout(240_000); // visits every page
  const seen = new Set<string>();
  for (const route of ROUTES) {
    await page.goto(route);
    const hrefs = await page.locator("a[href^='/']").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
    hrefs.filter((h) => !h.startsWith("/legacy/")).forEach((h) => seen.add(h.split("#")[0]));
  }
  for (const href of seen) {
    const r = await page.request.get(href);
    expect(r.status(), href).toBe(200);
  }
});

test("old addresses redirect to the new pages", async ({ page }) => {
  test.setTimeout(180_000); // visits every old address
  for (const p of PAGES) {
    await page.goto(`/${p.file}`);
    expect(new URL(page.url()).pathname, p.file).toBe(p.route);
  }
});

test("phone menu opens and lists every menu item", async ({ page, isMobile }) => {
  test.skip(!isMobile, "phone only");
  await page.goto("/");
  await page.getByRole("button", { name: "मेनू खोलें" }).click();
  const menu = page.locator("#mobile-menu");
  await expect(menu).toBeVisible();
  for (const m of [...site.header.menu, { label: "फोटो एल्बम" }]) {
    await expect(menu.getByRole("link", { name: m.label.trim(), exact: true })).toBeVisible();
  }
  await menu.getByRole("link", { name: "उद्देश्य", exact: true }).click();
  await expect(page).toHaveURL(/\/udeshya$/);
  await expect(menu).toBeHidden();
});

// A small phone (375 px). Checks the menu is really ON SCREEN, not just in the page:
// Playwright counts links clipped inside a zero-height panel as "visible".
test.describe("phone menu at 375 px", () => {
  test.use({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true });

  /** True when the element's centre is inside the screen and nothing covers it. */
  const onTop = (el: Element) => {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    if (r.width === 0 || r.height === 0 || x < 0 || y < 0 || x > innerWidth || y > innerHeight) return false;
    const hit = document.elementFromPoint(x, y);
    return !!hit && (hit === el || el.contains(hit));
  };

  test("☰ shows every menu item above the page; a link or ✕ closes it", async ({ page }, info) => {
    test.skip(info.project.name !== "phone", "phone project only");
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "मेनू खोलें" });
    await toggle.tap();
    const menu = page.locator("#mobile-menu");

    // The panel fills the screen width and most of its height.
    const box = (await menu.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(374);
    expect(box.height).toBeGreaterThan(400);

    // All 11 menu items can be scrolled to and are really on top (not hidden behind the page).
    const labels = site.header.menu.map((m: { label: string }) => m.label.trim());
    expect(labels.length + 1).toBe(11);
    for (const label of [...labels, "फोटो एल्बम"]) {
      const link = menu.getByRole("link", { name: label, exact: true });
      await link.scrollIntoViewIfNeeded();
      expect(await link.evaluate(onTop), label).toBe(true);
    }

    // फोटो एल्बम can be tapped and opens the album page; the menu closes.
    await menu.getByRole("link", { name: "फोटो एल्बम", exact: true }).tap();
    await expect(page).toHaveURL(/\/photo-album$/);
    await expect(menu).toBeHidden();

    // ✕ closes it too.
    await page.getByRole("button", { name: "मेनू खोलें" }).tap();
    await expect(menu).toBeVisible();
    await page.getByRole("button", { name: "मेनू बंद करें" }).tap();
    await expect(menu).toBeHidden();
    await expect(page.getByRole("button", { name: "मेनू खोलें" })).toBeVisible();
  });
});
