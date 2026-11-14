import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/**
 * Server-only database access with the secret key (bypasses security rules).
 * Used only after the server has checked the request itself — e.g. saving a
 * Shapath Patra form. Never import this into a client component.
 */
export function serviceDb() {
  const { url } = supabaseEnv();
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("SUPABASE_SECRET_KEY is missing from .env.local");
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}
