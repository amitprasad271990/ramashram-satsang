import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { PlaylistHeader, TrackList } from "@/components/TrackList";
import { audio } from "@/content";

export const metadata: Metadata = { title: "भजनमाला" };

export default function BhajanmalaPage() {
  return (
    <PageShell slug="musicnew">
      <PlaylistHeader heading={audio.pages.bhajan.heading} intro={audio.pages.bhajan.intro} />
      <TrackList tracks={audio.tracks.bhajan} />
    </PageShell>
  );
}
