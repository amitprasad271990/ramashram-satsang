import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { getAlbum, getAlbums } from "@/lib/data";
import { mediaUrl } from "@/lib/media";
import { PhotoGallery } from "./PhotoGallery";

type Props = { params: Promise<{ id: string }> };

// New albums made by the admin are rendered on first visit.
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getAlbums()).map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const album = await getAlbum((await params).id);
  return { title: album ? `${album.title} — फोटो एल्बम` : "फोटो एल्बम" };
}

export default async function AlbumPage({ params }: Props) {
  const album = await getAlbum((await params).id);
  if (!album) notFound();
  return (
    <PageShell slug="home" wide card={false}>
      <div data-ui>
        <Link href="/photo-album" className="inline-flex items-center gap-1 text-maroon hover:underline">
          <span aria-hidden>←</span> सभी एल्बम
        </Link>
        <h1 className="mt-3 text-center font-[family-name:var(--font-display)] text-3xl text-maroon sm:text-4xl">{album.title}</h1>
        <p className="mt-1 text-center text-ink-soft">{album.photos.length} चित्र</p>
      </div>
      <PhotoGallery
        title={album.title}
        photos={album.photos.map((p) => ({ ...p, src: mediaUrl(p.storage_key) }))}
      />
    </PageShell>
  );
}
