// CONTENT RULE: every page must keep exactly the same wording as the old site.
// These tests compare the text of each new page with the old HTML, character by
// character (spacing and line breaks are ignored; nothing else is).

import { expect, test, type Page } from "@playwright/test";
import { PAGES } from "../../scripts/page-map.mjs";
import site from "../../src/content/legacy/site.json";
import { currentAnnouncements } from "./db";
import { firstDifference, loadOld, oldContentText, squash } from "./legacy";

/** Text of the new page's main content, without new UI labels and typed-out image text. */
async function newContentText(page: Page) {
  return page.locator("main").evaluate((main) => {
    const clone = main.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("[data-ui], [data-transcribed], [data-compare]").forEach((el) => el.remove());
    return clone.textContent ?? "";
  });
}

test.describe("same text as the old site", () => {
  test.skip(({ isMobile }) => isMobile, "text is the same at every screen size");

  for (const p of PAGES) {
    test(`${p.file} → ${p.route}`, async ({ page }) => {
      await page.goto(p.route);
      const oldText = squash(oldContentText(p.file));
      const newText = squash(await newContentText(page));
      // Pravachanhold.html had no HTML text: its words were inside banner pictures (checked below).
      if (p.file !== "Pravachanhold.html") expect(oldText.length, "old page has text").toBeGreaterThan(0);
      expect(firstDifference(oldText, newText), "page text differs from the old site").toBeNull();
    });
  }

  test("announcement line on every page is the current one (the old one until the admin changes it)", async ({ page }) => {
    const db = await currentAnnouncements();
    for (const p of PAGES) {
      const $ = loadOld(p.file);
      const old = $("#ctl00_lbldetails").text();
      // Biography pages had no bar of their own; they opened inside Parichay.
      const oldText = old || loadOld("Parichay.html")("#ctl00_lbldetails").text();
      // Which of the two old lines this page showed, and what the database holds for it now.
      const key = Object.keys(site.announcements).find(
        (k) => squash(site.announcements[k as keyof typeof site.announcements]) === squash(oldText),
      );
      expect(key, `${p.route}: old line is one of the two known announcements`).toBeTruthy();
      // On a freshly set-up database (this Mac), the line must still be the old site's, word for word.
      if (!process.env.E2E_BASE_URL) expect(squash(db[key!]), `${p.route} database line`).toBe(squash(oldText));
      await page.goto(p.route);
      await expect(page.locator(`[data-announcement="${key}"]`).first(), `${p.route} announcement`).toHaveText(db[key!], {
        timeout: 10_000,
        useInnerText: true,
      });
    }
  });

  test("home page keeps the old header: portraits, captions, buttons and sayings", async ({ page }) => {
    await page.goto("/");
    const body = squash((await page.locator("body").textContent()) ?? "");
    const h = site.header;
    const strings = [
      h.englishTitle,
      ...h.founder.lines,
      ...h.dadaGuru.lines,
      ...h.jiyaMaa.lines,
      h.dadaGuru.quote,
      ...h.buttons.map((b) => b.label),
      ...h.quotes.map((q) => q.caption),
    ];
    for (const s of strings) expect(body, s).toContain(squash(s));
  });

  test("words typed out from pictures are shown", async ({ page }) => {
    await page.goto("/pravachan");
    const text = squash((await page.locator("main").textContent()) ?? "");
    const labels = site.pravachanIndex.flatMap((e) => [e.label, ...(e.children ?? []).map((c) => c.label)]);
    for (const l of labels) expect(text).toContain(squash(l));
  });

  test("menu and footer keep the old labels", async ({ page }) => {
    await page.goto("/udeshya");
    const header = squash((await page.locator("header").textContent()) ?? "");
    for (const m of site.header.menu) expect(header).toContain(squash(m.label));
    const footer = squash((await page.locator("footer").textContent()) ?? "");
    for (const l of site.header.footerLinks) expect(footer).toContain(squash(l));
    expect(footer).toContain(squash(site.header.copyright));
  });
});
