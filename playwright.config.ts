import { defineConfig, devices } from "@playwright/test";

// Tests read the same settings as the site (local Supabase keys).
try {
  process.loadEnvFile(".env.local");
} catch {}

const desktop = { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 900 } };
const PORT = Number(process.env.PORT ?? 3100);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"] }, testIgnore: /admin\.spec/ },
    { name: "desktop", use: desktop, testIgnore: /admin\.spec/ },
    // The admin tests change shared data (the announcement), so they run alone, after the others.
    { name: "admin", use: desktop, testMatch: /admin\.spec/, dependencies: ["phone", "desktop"] },
  ],
  webServer: {
    // Test the real production build (what visitors get). Set E2E_DEV=1 to use the dev server instead.
    command: process.env.E2E_DEV ? `npx next dev -p ${PORT}` : `rm -rf .next-e2e && npx next build && npx next start -p ${PORT}`,
    env: process.env.E2E_DEV ? {} : { NEXT_DIST_DIR: ".next-e2e" },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 300_000,
  },
});
