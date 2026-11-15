// A saved announcement must reach every page within seconds, even on AWS Amplify
// where pages are cached by several server copies (the bug of 15/11/2026).
//
// This test CHANGES the announcement for a few seconds and then puts the original
// text back. It runs alone, after the other tests (project "live-write").
// Run it against the live site with:  E2E_BASE_URL=https://… npx playwright test

import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { currentAnnouncements } from "./db";

const PAGES = ["/", "/udeshya", "/parichay", "/bhajanmala", "/moolsadhana"];

function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("SUPABASE_SECRET_KEY missing (needed to change and restore the announcement)");
  return createClient(url, secret, { auth: { persistSession: false } });
}

let original: Record<string, string> = {};

test.beforeAll(async () => {
  original = await currentAnnouncements();
  expect(Object.keys(original).length).toBeGreaterThan(0);
});

test.afterAll(async () => {
  // Always put the real announcement back, even if the test failed.
  const db = adminDb();
  for (const [key, text] of Object.entries(original)) {
    const { error } = await db.from("announcements").update({ text }).eq("key", key);
    if (error) throw error;
  }
  expect(await currentAnnouncements()).toEqual(original);
});

test("a saved announcement shows on every page within seconds", async ({ page }) => {
  const marker = `परीक्षण सूचना ${Date.now()} — कृपया ध्यान न दें`;
  const db = adminDb();
  const { data, error } = await db.from("announcements").update({ text: marker }).not("key", "is", null).select("key");
  expect(error).toBeNull();
  expect(data?.length).toBe(Object.keys(original).length);

  for (const path of PAGES) {
    const started = Date.now();
    await page.goto(path);
    await expect(page.locator("[data-announcement]").first(), path).toHaveText(marker, { timeout: 10_000 });
    console.log(`${path}: new announcement visible after ${((Date.now() - started) / 1000).toFixed(1)} s`);
  }
});
