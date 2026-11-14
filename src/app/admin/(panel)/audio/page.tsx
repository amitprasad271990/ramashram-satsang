import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/session";

const KIND = { bhajan: "भजन / Bhajan", amrit_vani: "अमृत वाणी / Amrit Vani", pravachan: "प्रवचन / Pravachan" } as const;

export default async function AudioAdminPage() {
  const { db } = await requireAdmin();
  const { data } = await db.from("audio_collections").select("slug, kind, heading, audio_tracks(count)").order("sort_order");
  return (
    <>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-maroon">
        ऑडियो <span className="text-lg text-ink-soft">/ Audio</span>
      </h1>
      <p className="mt-1 text-ink-soft">सूची चुनें, फिर MP3 अपलोड करें या नाम बदलें / Choose a list, then upload MP3s or edit titles</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {(data ?? []).map((c) => (
          <li key={c.slug}>
            <Link
              href={`/admin/audio/${c.slug}`}
              className="block rounded-3xl border border-sand bg-white p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
            >
              <p className="text-sm text-ink-soft">{KIND[c.kind as keyof typeof KIND]}</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-xl text-maroon">{c.heading}</p>
              <p className="mt-1 text-sm text-ink-soft tabular-nums">
                {(c.audio_tracks as unknown as { count: number }[])[0]?.count ?? 0} रिकॉर्डिंग / recordings
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
