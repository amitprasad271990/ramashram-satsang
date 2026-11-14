import Link from "next/link";
import { notFound } from "next/navigation";
import { mediaUrl } from "@/lib/media";
import { requireAdmin } from "@/lib/supabase/session";
import { AudioUploader, TrackEditor } from "./AudioAdmin";

export default async function AudioListAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db } = await requireAdmin();
  const { data: c } = await db
    .from("audio_collections")
    .select("slug, heading, audio_tracks(id, title, storage_key, duration_seconds, sort_order, created_at)")
    .eq("slug", slug)
    .order("sort_order", { referencedTable: "audio_tracks" })
    .order("created_at", { referencedTable: "audio_tracks" })
    .maybeSingle();
  if (!c) notFound();

  return (
    <>
      <Link href="/admin/audio" className="text-maroon hover:underline">
        ← सभी सूचियाँ / All lists
      </Link>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-maroon">{c.heading}</h1>
      <p className="text-ink-soft tabular-nums">{c.audio_tracks.length} रिकॉर्डिंग / recordings</p>

      <div className="mt-6">
        <AudioUploader collection={c.slug} />
      </div>

      <ol className="mt-8 grid gap-3">
        {c.audio_tracks.map((t, i) => (
          <TrackEditor
            key={t.id}
            track={{ id: t.id, title: t.title, src: mediaUrl(t.storage_key), duration: t.duration_seconds }}
            first={i === 0}
            last={i === c.audio_tracks.length - 1}
          />
        ))}
      </ol>
    </>
  );
}
