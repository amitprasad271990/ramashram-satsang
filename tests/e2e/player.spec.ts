// The site-wide audio player (Phase 3).

import { expect, test, type Page } from "@playwright/test";

const bar = (page: Page) => page.getByRole("region", { name: "ऑडियो प्लेयर" });

/** State of the site player's <audio> element. */
const audioState = (page: Page) =>
  page.evaluate(() => {
    const a = document.getElementById("site-player") as HTMLAudioElement;
    return { paused: a.paused, time: a.currentTime, src: a.currentSrc };
  });

async function waitPlaying(page: Page) {
  await page.waitForFunction(() => {
    const a = document.getElementById("site-player") as HTMLAudioElement | null;
    return !!a && !a.paused && a.currentTime > 0.3;
  }, null, { timeout: 20_000 });
}

test.beforeEach(async ({ page }) => {
  // Start each test with no saved positions (once — not again on reload).
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("e2e-cleared")) {
      localStorage.clear();
      sessionStorage.setItem("e2e-cleared", "1");
    }
  });
});

test("a bhajan plays from the list, pauses, and moves to the next one", async ({ page }) => {
  await page.goto("/bhajanmala");
  await expect(bar(page)).toHaveCount(0); // nothing until a bhajan is chosen

  const first = page.getByRole("button", { name: /^1\.गुरु वंदना/ });
  await first.click();
  await waitPlaying(page);
  await expect(bar(page)).toContainText("1.गुरु वंदना");
  await expect(bar(page).getByRole("link", { name: "भजनमाला" })).toHaveAttribute("href", "/bhajanmala");
  await expect(first).toHaveAttribute("aria-current", "true");

  await first.click(); // the same row again pauses
  await expect.poll(async () => (await audioState(page)).paused).toBe(true);
  await bar(page).getByRole("button", { name: "चलाएँ" }).click();
  await waitPlaying(page);

  await bar(page).getByRole("button", { name: "अगला" }).click();
  await expect(bar(page)).toContainText("2.वन्दना");
  await waitPlaying(page);
  expect((await audioState(page)).src).toContain("paramguru.mp3");

  await bar(page).getByRole("button", { name: "प्लेयर बंद करें" }).click();
  await expect(bar(page)).toHaveCount(0);
  expect((await audioState(page)).paused).toBe(true);
});

test("music keeps playing while moving to another page", async ({ page, isMobile }) => {
  test.skip(isMobile, "uses the desktop menu");
  await page.goto("/bhajanmala");
  await page.getByRole("button", { name: /^1\.गुरु वंदना/ }).click();
  await waitPlaying(page);

  await page.getByRole("navigation").getByRole("link", { name: "उद्देश्य", exact: true }).first().click();
  await expect(page).toHaveURL(/\/udeshya$/, { timeout: 20_000 });
  await expect(bar(page)).toContainText("1.गुरु वंदना");
  const before = (await audioState(page)).time;
  await expect.poll(async () => (await audioState(page)).time).toBeGreaterThan(before + 0.5);
});

test("bhajan search finds titles and says when nothing matches", async ({ page }) => {
  await page.goto("/bhajanmala");
  const rows = page.locator("main ol > li");
  const all = await rows.count();
  expect(all).toBe(81);

  await page.getByLabel("भजन खोजें").fill("वंदना");
  await expect.poll(() => rows.count()).toBeLessThan(all);
  await expect(rows.first()).toContainText("वंदना");
  await expect(page.getByText(/81 में से \d+ मिले/)).toBeVisible();

  await page.getByLabel("भजन खोजें").fill("कखगघ");
  await expect(page.getByText("कुछ नहीं मिला — कोई दूसरा शब्द लिखें")).toBeVisible();
  await expect(rows).toHaveCount(0);

  await page.getByLabel("भजन खोजें").fill("");
  await expect(rows).toHaveCount(all);
});

test("a long pravachan resumes where the listener stopped", async ({ page }) => {
  await page.goto("/pravachan/kolkata-2016");
  const first = page.getByRole("button", { name: /^1\.प्रवचन/ });
  await first.click();
  await waitPlaying(page);
  await page.evaluate(() => {
    const a = document.getElementById("site-player") as HTMLAudioElement;
    a.currentTime = 120;
  });
  await expect.poll(async () => (await audioState(page)).time).toBeGreaterThan(120);
  await bar(page).getByRole("button", { name: "रोकें" }).click();

  await page.reload();
  await page.getByRole("button", { name: /^1\.प्रवचन/ }).click();
  await waitPlaying(page);
  expect((await audioState(page)).time).toBeGreaterThan(115);
});

test("Amrit Vani recordings (incl. the converted ones) play, and can be downloaded", async ({ page, request }) => {
  await page.goto("/amrit-vani");
  await page.getByRole("button", { name: /^07 / }).click();
  await waitPlaying(page);
  expect((await audioState(page)).src).toContain("BabujiVoice/07.mp3");

  const href = await page.getByRole("link", { name: /^डाउनलोड करें: 07 / }).getAttribute("href");
  const res = await request.get(href!, { headers: { Range: "bytes=0-99" } });
  expect(res.status()).toBe(206);
});

test("the home page recording and the site player never play together", async ({ page, isMobile }) => {
  test.skip(isMobile, "uses the desktop menu");
  await page.goto("/bhajanmala");
  await page.getByRole("button", { name: /^1\.गुरु वंदना/ }).click();
  await waitPlaying(page);

  await page.getByRole("navigation").getByRole("link", { name: "मुख्यपृष्ठ", exact: true }).first().click();
  await expect(page).toHaveURL(/\/$/);
  await page.evaluate(() => (document.querySelector("main audio") as HTMLAudioElement).play());
  await page.waitForFunction(() => !(document.querySelector("main audio") as HTMLAudioElement).paused);
  await expect.poll(async () => (await audioState(page)).paused).toBe(true); // the bhajan paused itself
});
