import type { Metadata } from "next";

export const metadata: Metadata = { title: "फोटो एल्बम" };

// Albums arrive in Phase 4 (Supabase + Cloudflare R2).
export default function PhotoAlbumPage() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-4 pt-12 sm:px-6">
      <h1 className="text-center font-[family-name:var(--font-display)] text-3xl text-maroon">फोटो एल्बम</h1>
    </main>
  );
}
