// Admin uploads (Phase 5): MP3s into audio lists, photos into albums.
// Runs only against the LOCAL Supabase; creates and removes its own test data.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import ffmpeg from "ffmpeg-static";
import sharp from "sharp";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SECRET = process.env.SUPABASE_SECRET_KEY ?? "";
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const isLocal = /^http:\/\/(127\.0\.0\.1|localhost)/.test(URL_);

const ADMIN = { email: "e2e-media-admin@example.test", password: "e2e-Password-789" };
const TAG = "E2E परीक्षण";
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), "ramashram-e2e-"));
const MP3 = path.join(DIR, `${TAG} भजन.mp3`);
const BIG = path.join(DIR, "big-photo.jpg");
const SMALL = path.join(DIR, "small-photo.png");

test.describe.configure({ mode: "serial" });
test.skip(!isLocal || !SECRET, "needs the local Supabase (npm run db:start) and .env.local loaded");

let db: SupabaseClient;

async function cleanup() {
  const { data: tracks } = await db.from("audio_tracks").select("id, storage_key").like("title", `${TAG}%`);
  const { data: albums } = await db.from("photo_albums").select("id, photos(storage_key)").like("title", `${TAG}%`);
  const keys = [...(tracks ?? []).map((t) => t.storage_key), ...(albums ?? []).flatMap((a) => a.photos.map((p) => p.storage_key))];
  for (const k of keys) if (k.startsWith("uploads/")) fs.rmSync(path.resolve(".uploads", k.slice(8)), { force: true });
  await db.from("audio_tracks").delete().like("title", `${TAG}%`);
  await db.from("photo_albums").delete().like("title", `${TAG}%`);
}

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("ईमेल / Email").fill(ADMIN.email);
  await page.getByLabel("पासवर्ड / Password").fill(ADMIN.password);
  await page.getByRole("button", { name: "लॉगिन करें / Log in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

const waitPlaying = (page: Page) =>
  page.waitForFunction(() => {
    const a = document.getElementById("site-player") as HTMLAudioElement | null;
    return !!a && !a.paused && a.currentTime > 0.2;
  }, null, { timeout: 20_000 });

test.beforeAll(async () => {
  db = createClient(URL_, SECRET, { auth: { persistSession: false } });
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  const found = data.users.find((u) => u.email === ADMIN.email);
  if (found) await db.auth.admin.updateUserById(found.id, { password: ADMIN.password });
  else await db.auth.admin.createUser({ ...ADMIN, email_confirm: true });
  await db.from("admins").upsert({ email: ADMIN.email });
  await cleanup();

  // Test files: a 3-second MP3, a large phone-sized JPEG and a small PNG.
  execFileSync(ffmpeg as unknown as string, ["-y", "-loglevel", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=3", "-b:a", "64k", MP3]);
  await sharp({ create: { width: 4000, height: 3000, channels: 3, background: "#c9a04a" } }).jpeg().toFile(BIG);
  await sharp({ create: { width: 600, height: 800, channels: 3, background: "#7b1e2b" } }).png().toFile(SMALL);
});

test.afterAll(async () => {
  await cleanup();
  await db.from("admins").delete().eq("email", ADMIN.email);
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  const found = data.users.find((u) => u.email === ADMIN.email);
  if (found) await db.auth.admin.deleteUser(found.id);
  fs.rmSync(DIR, { recursive: true, force: true });
});

test("visitors cannot change audio or photo lists, nor upload", async ({ request }) => {
  const headers = { apikey: PUBLISHABLE, "Content-Type": "application/json" };
  // Valid rows, so it is the permission check (not a bad request) that refuses them.
  const { data: album } = await db.from("photo_albums").select("id").limit(1).single();
  const rows: Record<string, object> = {
    audio_tracks: { collection_slug: "bhajan", title: "x", storage_key: "uploads/x.mp3", sort_order: 999 },
    photo_albums: { title: "x" },
    photos: { album_id: album!.id, storage_key: "uploads/x.jpg", width: 1, height: 1 },
  };
  for (const [table, data] of Object.entries(rows)) {
    const r = await request.post(`${URL_}/rest/v1/${table}`, { headers, data });
    expect(r.status(), table).toBe(401);
  }
  const put = await request.put("/admin/api/upload?key=uploads/audio/bhajan/x.mp3&exp=9999999999&size=3&sig=00", {
    data: "abc",
    maxRedirects: 0,
  });
  expect([307, 403]).toContain(put.status()); // sent to the login page / refused
  // Paths that try to climb out of the uploads folder never return a file.
  for (const p of ["/local-media/..%2F..%2F.env.local", "/local-media/%2e%2e/%2e%2e/.env.local", "/local-media/../../.env.local"]) {
    const r = await request.get(p, { maxRedirects: 0 });
    expect(r.status(), p).not.toBe(200);
    expect(await r.text(), p).not.toContain("SUPABASE");
  }
});

test("admin uploads an MP3 and it plays on the public page", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: /ऑडियो/ }).first().click();
  await page.getByRole("link", { name: /भजनमाला/ }).click();
  await expect(page).toHaveURL(/\/admin\/audio\/bhajan$/);

  await page.locator('input[type="file"]').setInputFiles(MP3);
  await expect(page.getByText("✓ हो गया / Done")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(`input[value="${TAG} भजन"]`)).toBeVisible();

  const { data } = await db.from("audio_tracks").select("storage_key, duration_seconds, size_bytes").eq("title", `${TAG} भजन`).single();
  expect(data!.storage_key).toMatch(/^uploads\/audio\/bhajan\/[0-9a-f-]{36}\.mp3$/);
  expect(data!.duration_seconds).toBe(3);
  expect(data!.size_bytes).toBe(fs.statSync(MP3).size);

  await page.goto("/bhajanmala");
  const row = page.getByRole("button", { name: new RegExp(`^${TAG} भजन`) });
  await expect(row).toBeVisible();
  await expect(page.locator("main ol > li").last()).toContainText(`${TAG} भजन`); // added at the end
  await row.click();
  await waitPlaying(page);
});

test("admin renames, moves and deletes a recording", async ({ page }) => {
  await login(page);
  await page.goto("/admin/audio/bhajan");
  const titleInput = page.locator(`input[value="${TAG} भजन"]`);
  await titleInput.fill(`${TAG} भजन (नया नाम)`);
  await page.getByRole("button", { name: "सहेजें / Save" }).click();
  await expect(page.getByText("✓ नाम सहेजा / Title saved")).toBeVisible();

  const item = page.locator("ol > li", { has: page.locator(`input[value="${TAG} भजन (नया नाम)"]`) });
  await item.getByRole("button", { name: "ऊपर करें / Move up" }).click();
  await expect.poll(async () => page.locator("ol > li").nth(-2).locator("input").first().inputValue()).toBe(`${TAG} भजन (नया नाम)`);

  await page.goto("/bhajanmala");
  await expect(page.locator("main ol > li").nth(-2)).toContainText(`${TAG} भजन (नया नाम)`);

  const { data } = await db.from("audio_tracks").select("storage_key").like("title", `${TAG}%`).single();
  const file = path.resolve(".uploads", data!.storage_key.slice(8));
  expect(fs.existsSync(file)).toBe(true);

  await page.goto("/admin/audio/bhajan");
  page.once("dialog", (d) => d.accept());
  await page
    .locator("ol > li", { has: page.locator(`input[value="${TAG} भजन (नया नाम)"]`) })
    .getByRole("button", { name: "हटाएँ / Delete" })
    .click();
  await expect(page.locator(`input[value="${TAG} भजन (नया नाम)"]`)).toHaveCount(0);
  expect(fs.existsSync(file)).toBe(false);

  await page.goto("/bhajanmala");
  await expect(page.getByText(`${TAG} भजन`)).toHaveCount(0);
  await expect(page.locator("main ol > li")).toHaveCount(81); // back to the old site's list
});

test("admin creates an album, uploads photos (resized) and manages them", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: /फोटो एल्बम/ }).first().click();
  await page.getByLabel("नया एल्बम / New album").fill(`${TAG} एल्बम`);
  await page.getByRole("button", { name: "बनाएँ / Create" }).click();
  await expect(page).toHaveURL(/\/admin\/albums\/[0-9a-f-]{36}$/);
  const albumId = page.url().split("/").pop()!;

  await page.locator('input[type="file"]').setInputFiles([BIG, SMALL]);
  await expect(page.getByText("✓ हो गया / Done")).toHaveCount(2, { timeout: 30_000 });
  await expect(page.locator("main ul > li img")).toHaveCount(2);

  const { data: photos } = await db.from("photos").select("width, height, storage_key").eq("album_id", albumId).order("sort_order");
  expect(photos!.map((p) => [p.width, p.height])).toEqual([[2400, 1800], [600, 800]]); // big one shrunk, small one kept

  // Public pages: listed first, with its photo count; photos load.
  await page.goto("/photo-album");
  const card = page.getByRole("link", { name: new RegExp(`${TAG} एल्बम`) });
  await expect(card).toContainText("2 चित्र");
  await card.click();
  for (const img of await page.locator("main ul img").all()) {
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), { timeout: 20_000 }).toBe(true);
  }

  // Rename, reorder, delete one photo.
  await page.goto(`/admin/albums/${albumId}`);
  await page.getByLabel("एल्बम का नाम / Album name").fill(`${TAG} एल्बम (नया)`);
  await page.getByRole("button", { name: "सहेजें / Save" }).click();
  await expect(page.getByText("✓ नाम सहेजा / Name saved")).toBeVisible();
  await page.getByRole("button", { name: "पहले / Earlier" }).nth(1).click();
  await expect
    .poll(async () => (await db.from("photos").select("width").eq("album_id", albumId).order("sort_order")).data?.map((p) => p.width))
    .toEqual([600, 2400]);
  // …and the screen shows the new order (small photo first) before deleting "photo 2".
  const uuidOf = (key: string) => key.split("/").pop()!.replace(".jpg", "");
  await expect(page.locator("main ul > li img").first()).toHaveAttribute("src", new RegExp(uuidOf(photos![1].storage_key)));
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "चित्र 2 हटाएँ / Delete photo 2" }).click();
  await expect(page.locator("main ul > li img")).toHaveCount(1);
  expect(fs.existsSync(path.resolve(".uploads", photos![0].storage_key.slice(8)))).toBe(false); // the big one's file is gone

  await page.goto(`/photo-album/${albumId}`);
  await expect(page.getByRole("heading", { level: 1, name: `${TAG} एल्बम (नया)` })).toBeVisible();
  await expect(page.locator("main ul img")).toHaveCount(1);

  // Delete the album: its page disappears.
  await page.goto(`/admin/albums/${albumId}`);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "एल्बम हटाएँ / Delete album" }).click();
  await expect(page).toHaveURL(/\/admin\/albums$/);
  const res = await page.goto(`/photo-album/${albumId}`);
  expect(res?.status()).toBe(404);
  await page.goto("/photo-album");
  await expect(page.getByText(`${TAG} एल्बम`)).toHaveCount(0);
});
