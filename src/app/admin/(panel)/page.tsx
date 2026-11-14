import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/session";

export default async function AdminHome() {
  const { db } = await requireAdmin();
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const [{ count: total }, { count: week }] = await Promise.all([
    db.from("pledges").select("id", { count: "exact", head: true }),
    db.from("pledges").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
  ]);

  return (
    <>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-maroon">
        नमस्ते 🙏 <span className="block text-lg text-ink-soft">Welcome</span>
      </h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/shapath-patra"
          className="rounded-3xl border border-sand bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
        >
          <p className="text-ink-soft">सदस्य-शपथ पत्र / Pledges</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-5xl text-maroon tabular-nums">{total ?? 0}</p>
          <p className="mt-1 text-sm text-ink-soft">
            पिछले 7 दिनों में {week ?? 0} नए / {week ?? 0} new in the last 7 days
          </p>
        </Link>
        <Link
          href="/admin/announcement"
          className="rounded-3xl border border-sand bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
        >
          <p className="text-ink-soft">सूचना पंक्ति / Announcement line</p>
          <p className="mt-2 font-semibold text-maroon">बदलें → / Change →</p>
          <p className="mt-1 text-sm text-ink-soft">
            शिविर की नई तिथि, स्थान व संपर्क / New shivir dates, venue and contacts
          </p>
        </Link>
        <Link
          href="/admin/audio"
          className="rounded-3xl border border-sand bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
        >
          <p className="text-ink-soft">भजन, प्रवचन, अमृत वाणी / Audio</p>
          <p className="mt-2 font-semibold text-maroon">MP3 अपलोड व नाम बदलें → / Upload & edit →</p>
        </Link>
        <Link
          href="/admin/albums"
          className="rounded-3xl border border-sand bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
        >
          <p className="text-ink-soft">फोटो एल्बम / Photo albums</p>
          <p className="mt-2 font-semibold text-maroon">एल्बम बनाएँ, चित्र अपलोड करें → / Create & upload →</p>
        </Link>
      </div>
    </>
  );
}
