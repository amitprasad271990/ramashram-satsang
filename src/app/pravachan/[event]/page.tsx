import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { PlaylistHeader, TrackList } from "@/components/TrackList";
import { audio, type PageSlug, type PravachanEvent } from "@/content";

type Props = { params: Promise<{ event: string }> };

/** Which old page each event came from (for its announcement line). */
const OLD_PAGE: Record<PravachanEvent, PageSlug> = {
  "kolkata-2016": "PravachaKolkata2016",
  "kolkata-2013": "Pravachankolkata",
  "lonavala-2014": "Pravachanlonavala",
  "aurangabad-2013": "Pravachannew",
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(OLD_PAGE).map((event) => ({ event }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { event } = await params;
  return { title: audio.pages[event as PravachanEvent]?.heading.replace(/\s+/g, " ") };
}

export default async function PravachanEventPage({ params }: Props) {
  const event = (await params).event as PravachanEvent;
  if (!(event in OLD_PAGE)) notFound();
  return (
    <PageShell slug={OLD_PAGE[event]}>
      <PlaylistHeader heading={audio.pages[event].heading} intro={audio.pages[event].intro} />
      <TrackList tracks={audio.tracks.pravachan[event]} />
    </PageShell>
  );
}
