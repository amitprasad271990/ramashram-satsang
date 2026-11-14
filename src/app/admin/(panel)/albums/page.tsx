import Image from "next/image";
import Link from "next/link";
import { mediaUrl } from "@/lib/media";
import { requireAdmin } from "@/lib/supabase/session";
import { NewAlbumForm } from "./AlbumAdmin";

export default async function AlbumsAdminPage() {
  const { db } = await requireAdmin();
  const { data } = await db
    .from("photo_albums")
    .select("id, title, photos(storage_key, sort_order)")
    .order("sort_order")
    .order("created_at", { ascending: false })
    .order("sort_order", { referencedTable: "photos" });
  const albums = data ?? [];

  return (
    <>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-maroon">
        फोटो एल्बम <span className="text-lg text-ink-soft">/ Photo albums</span>
      </h1>
      <div className="mt-6">
        <NewAlbumForm />
      </div>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {albums.map((a) => (
          <li key={a.id}>
            <Link
              href={`/admin/albums/${a.id}`}
              className="flex items-center gap-4 rounded-3xl border border-sand bg-white p-3 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
            >
              <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-cream">
                {a.photos[0] && <Image src={mediaUrl(a.photos[0].storage_key)} alt="" fill sizes="5rem" className="object-cover object-top" />}
              </span>
              <span className="min-w-0">
                <span className="block font-[family-name:var(--font-display)] text-xl text-maroon">{a.title}</span>
                <span className="text-sm text-ink-soft tabular-nums">{a.photos.length} चित्र / photos</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {albums.length === 0 && <p className="mt-6 text-ink-soft">अभी कोई एल्बम नहीं / No albums yet</p>}
    </>
  );
}
