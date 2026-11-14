"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { PLEDGE_MESSAGES, validatePledge, type PledgeErrors } from "@/lib/pledge";
import { serviceDb } from "@/lib/supabase/service";

export type PledgeState = { status: "idle" | "error" | "success"; message?: string; errors?: PledgeErrors };

/** Max submissions from one connection in 10 minutes (stops accidental repeats and spam). */
const LIMIT = 3;

export async function submitPledge(_prev: PledgeState, form: FormData): Promise<PledgeState> {
  // Hidden "website" field: people never fill it, spam robots usually do.
  if (String(form.get("website") ?? "")) return { status: "success", message: PLEDGE_MESSAGES.success };

  const checked = validatePledge({
    name: String(form.get("name") ?? ""),
    address: String(form.get("address") ?? ""),
    phone: String(form.get("phone") ?? ""),
  });
  if (!checked.ok) return { status: "error", errors: checked.errors };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const ipHash = createHash("sha256").update(`${ip}|${process.env.SUPABASE_SECRET_KEY}`).digest("hex");

  try {
    const db = serviceDb();
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count, error: countError } = await db
      .from("pledges")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if (countError) throw countError;
    if ((count ?? 0) >= LIMIT) return { status: "error", message: PLEDGE_MESSAGES.tooMany };

    const { error } = await db.from("pledges").insert({ ...checked.value, address: checked.value.address || null, ip_hash: ipHash });
    if (error) throw error;
  } catch (e) {
    console.error("Saving pledge failed:", e);
    return { status: "error", message: PLEDGE_MESSAGES.failed };
  }
  return { status: "success", message: PLEDGE_MESSAGES.success };
}
