"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, sessionDb } from "@/lib/supabase/session";

export type FormState = { error?: string; ok?: string };

const NOT_ADMIN = "इस खाते को एडमिन अनुमति नहीं है / This account is not an admin";

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "ईमेल और पासवर्ड दोनों लिखें / Enter both email and password" };
  const db = await sessionDb();
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) return { error: "ईमेल या पासवर्ड गलत है / Wrong email or password" };
  // A correct password is not enough: the account must also be on the admin list.
  const { data: isAdmin } = await db.rpc("is_admin");
  if (!isAdmin) {
    await db.auth.signOut();
    return { error: NOT_ADMIN };
  }
  redirect("/admin");
}

export async function signOut() {
  const db = await sessionDb();
  await db.auth.signOut();
  redirect("/admin/login");
}

export async function deletePledge(id: string) {
  const { db } = await requireAdmin();
  const { error } = await db.from("pledges").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin", "layout");
}

/** Replace the announcement line on every page of the site. */
export async function saveAnnouncement(_prev: FormState, form: FormData): Promise<FormState> {
  const { db } = await requireAdmin();
  const text = String(form.get("text") ?? "").replace(/\s+/g, " ").trim();
  if (!text) return { error: "सूचना खाली नहीं हो सकती / The announcement cannot be empty" };
  if (text.length > 1000) return { error: "सूचना बहुत लंबी है / The announcement is too long" };
  const { data, error } = await db.from("announcements").update({ text }).not("key", "is", null).select("key");
  if (error || !data?.length) return { error: "सहेजा नहीं जा सका / Could not save" };
  revalidatePath("/", "layout"); // refresh every public page
  return { ok: "सहेज लिया गया — अब सभी पृष्ठों पर दिखेगी / Saved — now shown on all pages" };
}
