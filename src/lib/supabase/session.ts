import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseEnv } from "./env";

/** Database access as the logged-in admin (session kept in a secure cookie). */
export async function sessionDb() {
  const { url, key } = supabaseEnv();
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component: cookies can't be set there; middleware refreshes them.
        }
      },
    },
  });
}

/**
 * For admin pages and actions: returns the database session of a logged-in
 * admin, or sends the visitor to the login page.
 */
export async function requireAdmin() {
  const db = await sessionDb();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: isAdmin } = await db.rpc("is_admin");
  if (!isAdmin) {
    await db.auth.signOut();
    redirect("/admin/login?error=not-admin");
  }
  return { db, user };
}
