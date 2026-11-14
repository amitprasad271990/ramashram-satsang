// Photo albums (Phase 4).

import { expect, test } from "@playwright/test";

const ALBUM = "सत्संग चित्र संग्रह";

test("album list shows the starting album with its photo count", async ({ page }) => {
  await page.goto("/photo-album");
  const card = page.getByRole("link", { name: new RegExp(ALBUM) });
  await expect(card).toBeVisible();
  await expect(card).toContainText("11 चित्र");
  await card.click();
  await expect(page).toHaveURL(/\/photo-album\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name: ALBUM })).toBeVisible();
});

test("every photo in the album loads", async ({ page }) => {
  await page.goto("/photo-album");
  await page.getByRole("link", { name: new RegExp(ALBUM) }).click();
  const imgs = page.locator("main ul img");
  await expect(imgs).toHaveCount(11);
  for (const img of await imgs.all()) {
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(async () => {
        await img.scrollIntoViewIfNeeded(); // like a visitor scrolling to it
        return img.evaluate((el: HTMLImageElement) => (el.complete && el.naturalWidth > 0 ? "ok" : `not loaded: ${el.currentSrc}`));
      }, {
        timeout: 20_000,
      })
      .toBe("ok");
  }
});

test("full-screen viewer: next/previous, keys, Back button and close", async ({ page }) => {
  await page.goto("/photo-album");
  await page.getByRole("link", { name: new RegExp(ALBUM) }).click();
  await expect(page.locator("main ul img").first()).toBeVisible();

  await page.getByRole("button", { name: /चित्र 1 — बड़ा देखें/ }).click();
  const viewer = page.getByRole("dialog");
  await expect(viewer).toBeVisible();
  await expect(viewer).toContainText("1 / 11");
  await expect(viewer.getByRole("button", { name: "पिछला चित्र" })).toHaveCount(0); // none before the first

  await viewer.getByRole("button", { name: "अगला चित्र" }).click();
  await expect(viewer).toContainText("2 / 11");
  await page.keyboard.press("ArrowRight");
  await expect(viewer).toContainText("3 / 11");
  await page.keyboard.press("ArrowLeft");
  await expect(viewer).toContainText("2 / 11");
  const big = viewer.locator("img").first();
  await expect.poll(() => big.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), { timeout: 20_000 }).toBe(true);

  await page.keyboard.press("Escape");
  await expect(viewer).toHaveCount(0);

  // The phone's Back button closes the viewer and stays on the album.
  const albumUrl = page.url();
  await page.getByRole("button", { name: /चित्र 5 — बड़ा देखें/ }).click();
  await expect(viewer).toContainText("5 / 11");
  await page.goBack();
  await expect(viewer).toHaveCount(0);
  expect(page.url()).toBe(albumUrl);

  await page.getByRole("button", { name: /चित्र 11 — बड़ा देखें/ }).click();
  await expect(viewer.getByRole("button", { name: "अगला चित्र" })).toHaveCount(0); // none after the last
  await viewer.getByRole("button", { name: "बंद करें" }).click();
  await expect(viewer).toHaveCount(0);
});

test("swiping changes the photo on a phone", async ({ page, isMobile }) => {
  test.skip(!isMobile, "phone only");
  await page.goto("/photo-album");
  await page.getByRole("link", { name: new RegExp(ALBUM) }).click();
  await expect(page.locator("main ul img").first()).toBeVisible();
  await page.getByRole("button", { name: /चित्र 1 — बड़ा देखें/ }).click();
  const viewer = page.getByRole("dialog");

  const swipe = (from: number, to: number) =>
    viewer.evaluate((el, [a, b]) => {
      const t = (x: number) => new Touch({ identifier: 1, target: el, clientX: x, clientY: 400 });
      el.dispatchEvent(new TouchEvent("touchstart", { touches: [t(a)], bubbles: true }));
      el.dispatchEvent(new TouchEvent("touchmove", { touches: [t(b)], bubbles: true }));
      el.dispatchEvent(new TouchEvent("touchend", { touches: [], bubbles: true }));
    }, [from, to]);

  await swipe(300, 100); // swipe left → next
  await expect(viewer).toContainText("2 / 11");
  await swipe(100, 300); // swipe right → previous
  await expect(viewer).toContainText("1 / 11");
});

test("an unknown album address shows the not-found page", async ({ page }) => {
  for (const id of ["00000000-0000-0000-0000-000000000000", "not-an-album"]) {
    const res = await page.goto(`/photo-album/${id}`);
    expect(res?.status(), id).toBe(404);
  }
});
