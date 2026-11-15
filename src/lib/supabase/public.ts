import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/**
 * How long (seconds) a database answer may be reused by the website server.
 * Without a limit, Next.js keeps answers inside pre-built pages for ever — and
 * AWS Amplify even carried them into later builds, so admin changes never showed.
 */
export const DB_REVALIDATE_SECONDS = 60;

/** Read-only database access for public pages (visitors can only read). */
export function publicDb() {
  const { url, key } = supabaseEnv();
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, next: { revalidate: DB_REVALIDATE_SECONDS } }),
    },
  });
}
