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
