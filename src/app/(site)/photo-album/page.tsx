import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { getAlbums } from "@/lib/data";
import { mediaUrl } from "@/lib/media";

export const metadata: Metadata = { title: "फोटो एल्बम" };

export default async function PhotoAlbumsPage() {
  const albums = await getAlbums();
  return (
    <PageShell slug="home" wide card={false}>
      <h1 className="text-center font-[family-name:var(--font-display)] text-3xl text-maroon sm:text-4xl">फोटो एल्बम</h1>

      <ul data-ui className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {albums.map((a) => (
          <li key={a.id}>
            <Link
              href={`/photo-album/${a.id}`}
              className="group block overflow-hidden rounded-3xl border border-sand/70 bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
            >
              <div className="relative aspect-[4/3] bg-cream">
                {a.cover && (
                  <Image
                    src={mediaUrl(a.cover.storage_key)}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 92vw"
                    className="object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                  />
                )}
              </div>
              <div className="flex items-baseline justify-between gap-3 px-5 py-4">
                <h2 className="font-[family-name:var(--font-display)] text-xl text-maroon">{a.title}</h2>
                <span className="shrink-0 text-sm text-ink-soft">{a.count} चित्र</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {albums.length === 0 && <p data-ui className="mt-10 text-center text-ink-soft">अभी कोई एल्बम नहीं है।</p>}
    </PageShell>
  );
}
