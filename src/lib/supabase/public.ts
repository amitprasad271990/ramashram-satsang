import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/** Read-only database access for public pages (visitors can only read). */
export function publicDb() {
  const { url, key } = supabaseEnv();
  return createClient(url, key, { auth: { persistSession: false } });
}
