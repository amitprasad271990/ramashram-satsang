import type { Metadata } from "next";
import { requireAdmin } from "@/lib/supabase/session";
import { AnnouncementForm } from "./AnnouncementForm";

export const metadata: Metadata = { title: "सूचना / Announcement" };

export default async function AnnouncementPage() {
  const { db } = await requireAdmin();
  const { data } = await db.from("announcements").select("key, text, updated_at").order("updated_at", { ascending: false });
  const current = data ?? [];
  const allSame = new Set(current.map((a) => a.text)).size <= 1;

  return (
    <>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-maroon">
        सूचना पंक्ति <span className="block text-lg text-ink-soft">Announcement line</span>
      </h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        यह पंक्ति वेबसाइट के हर पृष्ठ पर ऊपर दिखती है। नया शिविर, तिथि, स्थान और संपर्क नंबर यहाँ लिखें।
        <br />
        This line appears at the top of every page. Write the next shivir&apos;s dates, venue and contact numbers here.
      </p>

      {!allSame && (
        <div className="mt-6 rounded-2xl border border-gold/60 bg-saffron-soft/50 p-4">
          <p className="font-semibold text-maroon-deep">
            अभी दो अलग सूचनाएँ दिख रही हैं (पुरानी वेबसाइट की तरह)। सहेजने पर सभी पृष्ठों पर एक ही सूचना दिखेगी।
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Two different lines are shown now (as on the old site). After saving, every page shows the same line.
          </p>
          <ul className="mt-3 grid gap-2 text-sm">
            {current.map((a) => (
              <li key={a.key} className="rounded-xl bg-white px-3 py-2">{a.text}</li>
            ))}
          </ul>
        </div>
      )}

      <AnnouncementForm initial={current[0]?.text ?? ""} />
    </>
  );
}
