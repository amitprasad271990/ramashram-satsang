import Link from "next/link";
import { notFound } from "next/navigation";
import { mediaUrl } from "@/lib/media";
import { requireAdmin } from "@/lib/supabase/session";
import { AlbumSettings, PhotoTile, PhotoUploader } from "../AlbumAdmin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AlbumAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { db } = await requireAdmin();
  const { data: album } = await db
    .from("photo_albums")
    .select("id, title, photos(id, storage_key, sort_order, created_at)")
    .eq("id", id)
    .order("sort_order", { referencedTable: "photos" })
    .order("created_at", { referencedTable: "photos" })
    .maybeSingle();
  if (!album) notFound();

  return (
    <>
      <Link href="/admin/albums" className="text-maroon hover:underline">
        ← सभी एल्बम / All albums
      </Link>
      <div className="mt-3">
        <AlbumSettings id={album.id} title={album.title} count={album.photos.length} />
      </div>
      <div className="mt-6">
        <PhotoUploader albumId={album.id} />
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {album.photos.map((p, i) => (
          <PhotoTile key={p.id} id={p.id} src={mediaUrl(p.storage_key)} n={i + 1} first={i === 0} last={i === album.photos.length - 1} />
        ))}
      </ul>
    </>
  );
}
