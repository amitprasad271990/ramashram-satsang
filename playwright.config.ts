import { defineConfig, devices } from "@playwright/test";

// Tests read the same settings as the site: the local Supabase keys, or the
// live (cloud) ones when testing the deployed site with E2E_BASE_URL.
try {
  process.loadEnvFile(process.env.E2E_BASE_URL ? ".env.cloud" : ".env.local");
} catch {}

const desktop = { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 900 } };
const PORT = Number(process.env.PORT ?? 3100);
// E2E_BASE_URL=https://… tests a deployed site instead (no local server; admin tests are skipped).
const LIVE = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  // 4 browsers at once: more makes this Mac too busy (photos resizing, audio) and tests flaky.
  workers: 4,
  // One retry; a test that passes only on retry is reported as "flaky" (not hidden).
  retries: 1,
  reporter: [["list"]],
  use: { baseURL: LIVE || `http://localhost:${PORT}` },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"] }, testIgnore: [/admin.*\.spec/, /live\.spec/] },
    { name: "desktop", use: desktop, testIgnore: [/admin.*\.spec/, /live\.spec/] },
    // Tests that change shared data run alone, after the others: the admin tests on this
    // Mac, or (live site only) the announcement test, which puts the real text back after.
    LIVE
      ? { name: "live-write", use: desktop, testMatch: /live\.spec/, dependencies: ["phone", "desktop"] }
      : { name: "admin", use: desktop, testMatch: /admin.*\.spec/, dependencies: ["phone", "desktop"] },
  ],
  webServer: LIVE ? undefined : {
    // Test the real production build (what visitors get). Set E2E_DEV=1 to use the dev server instead.
    command: process.env.E2E_DEV ? `npx next dev -p ${PORT}` : `rm -rf .next-e2e && npx next build && npx next start -p ${PORT}`,
    env: process.env.E2E_DEV ? {} : { NEXT_DIST_DIR: ".next-e2e" },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 300_000,
  },
});
