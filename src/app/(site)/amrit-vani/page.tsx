import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { PlaylistHeader, TrackList } from "@/components/TrackList";
import { imageSize, site } from "@/content";
import { getCollection } from "@/lib/data";
import { mediaUrl } from "@/lib/media";

export const metadata: Metadata = { title: "अमृत वाणी" };

export default async function AmritVaniPage() {
  const c = await getCollection("amrit-vani");
  if (!c) notFound();
  const p = site.amritVaniPage;
  const size = imageSize(p.image);
  return (
    <PageShell slug="samparksutra">
      <PlaylistHeader heading={c.heading} />
      <figure className="mt-6 flex flex-col items-center">
        <Image
          src={mediaUrl(p.image)}
          width={size.width}
          height={size.height}
          alt=""
          sizes="14rem"
          priority
          className="h-auto w-48 rounded-3xl border-4 border-white shadow-[var(--shadow-card)] ring-1 ring-gold/50 sm:w-56"
        />
        <a
          href={`https://www.youtube.com/watch?v=${p.youtubeVideo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-maroon px-6 py-3 font-[family-name:var(--font-display)] text-xl text-white shadow-md transition hover:-translate-y-0.5 hover:bg-maroon-deep"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-gold-light" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
          {p.youtubeLabel}
        </a>
      </figure>
      <TrackList collection={c} href="/amrit-vani" searchLabel="खोजें" />
    </PageShell>
  );
}
