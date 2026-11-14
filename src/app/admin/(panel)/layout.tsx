import Link from "next/link";
import { LotusMark } from "@/components/Ornaments";
import { requireAdmin } from "@/lib/supabase/session";
import { signOut } from "../actions";
import { AdminNav } from "./AdminNav";

/** Every page in here requires the admin to be logged in. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <>
      <header className="z-30 border-b sm:sticky sm:top-0 border-gold/40 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2 text-maroon">
            <LotusMark className="h-9 w-9" />
            <span className="font-[family-name:var(--font-display)] text-lg leading-tight">
              एडमिन <span className="text-sm text-ink-soft">Admin</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-ink-soft sm:inline">{user.email}</span>
            <Link href="/" className="text-sm text-maroon underline underline-offset-4" target="_blank">
              वेबसाइट देखें / View site
            </Link>
            <form action={signOut}>
              <button className="rounded-full border-2 border-maroon/30 px-4 py-1.5 text-sm font-semibold text-maroon hover:bg-saffron-soft">
                लॉग आउट / Log out
              </button>
            </form>
          </div>
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">{children}</main>
    </>
  );
}
