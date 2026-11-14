// Shapath Patra form → database → admin portal, plus the admin login guard.
// Runs only against the LOCAL Supabase (it creates and deletes test data).

import { expect, test, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SECRET = process.env.SUPABASE_SECRET_KEY ?? "";
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const isLocal = /^http:\/\/(127\.0\.0\.1|localhost)/.test(URL_);

const ADMIN = { email: "e2e-admin@example.test", password: "e2e-Password-123" };
const OTHER = { email: "e2e-not-admin@example.test", password: "e2e-Password-456" };
const TAG = "E2E परीक्षण"; // every test pledge name starts with this

test.describe.configure({ mode: "serial" });
test.skip(!isLocal || !SECRET, "needs the local Supabase (npm run db:start) and .env.local loaded");

let db: SupabaseClient;
let originalAnnouncements: { key: string; text: string }[] = [];

async function ensureUser(u: { email: string; password: string }) {
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  const found = data.users.find((x) => x.email === u.email);
  if (found) await db.auth.admin.updateUserById(found.id, { password: u.password });
  else await db.auth.admin.createUser({ ...u, email_confirm: true });
}

async function removeUser(email: string) {
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  const found = data.users.find((x) => x.email === email);
  if (found) await db.auth.admin.deleteUser(found.id);
}

async function login(page: Page, u: { email: string; password: string }) {
  await page.goto("/admin/login");
  await page.getByLabel("ईमेल / Email").fill(u.email);
  await page.getByLabel("पासवर्ड / Password").fill(u.password);
  await page.getByRole("button", { name: "लॉगिन करें / Log in" }).click();
}

async function loginAdmin(page: Page) {
  await login(page, ADMIN);
  await expect(page).toHaveURL(/\/admin$/); // wait until the session cookie is set
}

test.beforeAll(async () => {
  db = createClient(URL_, SECRET, { auth: { persistSession: false } });
  await ensureUser(ADMIN);
  await ensureUser(OTHER);
  await db.from("admins").upsert({ email: ADMIN.email });
  await db.from("pledges").delete().like("name", `${TAG}%`);
  const { data } = await db.from("announcements").select("key, text");
  originalAnnouncements = data ?? [];
});

test.afterAll(async () => {
  await db.from("pledges").delete().like("name", `${TAG}%`);
  for (const a of originalAnnouncements) await db.from("announcements").update({ text: a.text }).eq("key", a.key);
  await db.from("admins").delete().eq("email", ADMIN.email);
  await removeUser(ADMIN.email);
  await removeUser(OTHER.email);
});

test("visitors cannot read or add pledges directly", async ({ request }) => {
  const headers = { apikey: PUBLISHABLE, "Content-Type": "application/json" };
  const read = await request.get(`${URL_}/rest/v1/pledges?select=*`, { headers });
  expect(await read.json()).toEqual([]);
  const write = await request.post(`${URL_}/rest/v1/pledges`, { headers, data: { name: "x", phone: "9876543210" } });
  expect(write.status()).toBe(401);
});

test("form asks for a name and a real phone number", async ({ page }) => {
  await page.goto("/sadasya-shapath-patra");
  await page.getByRole("button", { name: "OK" }).click();
  await expect(page.getByText("कृपया अपना नाम लिखें।")).toBeVisible();
  await expect(page.getByText(/कृपया सही फ़ोन नंबर लिखें/)).toBeVisible();
});

test("a visitor's pledge is saved", async ({ page }) => {
  await page.goto("/sadasya-shapath-patra");
  await page.locator('input[name="name"]').fill(`${TAG} राम कुमार`);
  await page.locator('textarea[name="address"]').fill("70, नलिनी सेठ रोड, कोलकाता");
  await page.locator('input[name="phone"]').fill("98765 43210");
  await page.getByRole("button", { name: "OK" }).click();
  await expect(page.getByText(/धन्यवाद! आपका शपथ पत्र प्राप्त हो गया है/)).toBeVisible();

  const { data } = await db.from("pledges").select("name, address, phone").like("name", `${TAG}%`);
  expect(data).toEqual([{ name: `${TAG} राम कुमार`, address: "70, नलिनी सेठ रोड, कोलकाता", phone: "9876543210" }]);
});

test("admin pages and the download need a login", async ({ page, request }) => {
  for (const path of ["/admin", "/admin/shapath-patra", "/admin/announcement"]) {
    await page.goto(path);
    await expect(page, path).toHaveURL(/\/admin\/login$/);
  }
  const csv = await request.get("/admin/shapath-patra/export", { maxRedirects: 0 });
  expect(csv.status()).toBeGreaterThanOrEqual(300);
  expect(csv.status()).toBeLessThan(400);
});

test("wrong password and non-admin accounts are refused", async ({ page }) => {
  await login(page, { email: ADMIN.email, password: "wrong-password-1" });
  await expect(page.getByText("ईमेल या पासवर्ड गलत है / Wrong email or password")).toBeVisible();

  await login(page, OTHER);
  await expect(page.getByText("इस खाते को एडमिन अनुमति नहीं है / This account is not an admin")).toBeVisible();
  await page.goto("/admin"); // and the refused account has no session left
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("admin sees, searches, downloads and deletes pledges", async ({ page }) => {
  await loginAdmin(page);

  await page.getByRole("link", { name: /शपथ पत्र/ }).first().click();
  await expect(page.getByText(`${TAG} राम कुमार`)).toBeVisible();
  await expect(page.getByText("9876543210")).toBeVisible();

  await page.getByPlaceholder(/नाम, फ़ोन या पता खोजें/).fill("नलिनी");
  await page.getByRole("button", { name: "खोजें" }).click();
  await expect(page).toHaveURL(/q=/);
  await expect(page.getByText(`${TAG} राम कुमार`)).toBeVisible();

  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: /Excel/ }).click();
  const csv = await (await download).createReadStream();
  const text = await new Promise<string>((res) => {
    let s = "";
    csv.on("data", (c) => (s += c));
    csv.on("end", () => res(s));
  });
  expect(text.charCodeAt(0)).toBe(0xfeff); // Excel reads Hindi correctly
  expect(text).toContain(`"${TAG} राम कुमार"`);

  await page.waitForLoadState("networkidle"); // let React attach the button's click handler
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "हटाएँ / Delete" }).click();
  await expect(page.getByText(/कुछ नहीं मिला|अभी तक कोई शपथ पत्र नहीं आया/)).toBeVisible({ timeout: 15_000 });
  const { data } = await db.from("pledges").select("id").like("name", `${TAG}%`);
  expect(data).toEqual([]);
});

test("admin changes the announcement and every page shows it", async ({ page }) => {
  await loginAdmin(page);
  await page.goto("/admin/announcement");
  const text = "E2E: अगला मूल साधना शिविर — परीक्षण सूचना 01/01/2027";
  await page.getByLabel("नई सूचना / New announcement").fill(text);
  await page.getByRole("button", { name: "सहेजें / Save" }).click();
  await expect(page.getByText(/सहेज लिया गया/)).toBeVisible();

  for (const path of ["/", "/udeshya", "/bhajanmala"]) {
    await page.goto(path);
    await expect(page.getByText(text), path).toBeVisible();
  }
});

test("log out ends the admin session", async ({ page }) => {
  await loginAdmin(page);
  await page.getByRole("button", { name: "लॉग आउट / Log out" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});
