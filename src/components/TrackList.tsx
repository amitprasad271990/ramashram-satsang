import type { AudioCollection } from "@/lib/data";
import { mediaUrl } from "@/lib/media";
import { Playlist } from "./player/Playlist";

/**
 * A playlist with the exact titles and order from the old site. Each title
 * is a play button for the site-wide player.
 */
export function TrackList({
  collection,
  href,
  searchLabel,
}: {
  collection: AudioCollection;
  /** this page's address (the player bar links back to it) */
  href: string;
  /** show a search box with this label (long lists only) */
  searchLabel?: string;
}) {
  return (
    <Playlist
      searchLabel={searchLabel}
      tracks={collection.tracks.map((t) => ({
        id: t.id,
        title: t.title,
        src: mediaUrl(t.storage_key),
        album: collection.heading.replace(/\s+/g, " ").trim(),
        href,
        duration: t.duration_seconds,
      }))}
    />
  );
}

/** Page heading + intro line of an old playlist page. */
export function PlaylistHeader({ heading, intro }: { heading: string; intro?: string | null }) {
  return (
    <div className="legacy-content">
      <h2 className="text-center">{heading}</h2>
      {intro && <p className="text-center">{intro}</p>}
    </div>
  );
}
