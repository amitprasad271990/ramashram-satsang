import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { PlaylistHeader, TrackList } from "@/components/TrackList";
import { getCollection } from "@/lib/data";

export const metadata: Metadata = { title: "भजनमाला" };

export default async function BhajanmalaPage() {
  const c = await getCollection("bhajan");
  if (!c) notFound();
  return (
    <PageShell slug="musicnew">
      <PlaylistHeader heading={c.heading} intro={c.intro} />
      <TrackList collection={c} href="/bhajanmala" searchLabel="भजन खोजें" />
    </PageShell>
  );
}
