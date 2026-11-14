import type { AudioTrack } from "@/lib/data";

/**
 * A playlist with the exact titles and order from the old site.
 * (Phase 3 turns each row into a play button for the site-wide audio player.)
 */
export function TrackList({ tracks }: { tracks: AudioTrack[] }) {
  return (
    <ol className="mt-8 grid gap-2.5">
      {tracks.map((t) => (
        <li
          key={t.id}
          className="flex items-center gap-3 rounded-2xl border border-sand/70 bg-white px-4 py-3 shadow-[0_1px_2px_rgb(79_17_25/0.05)] transition hover:border-gold hover:shadow-[var(--shadow-card)]"
        >
          <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-saffron-soft text-saffron">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M12 3v10.6A4 4 0 1 0 14 17V7h4V3z" />
            </svg>
          </span>
          <span className="min-w-0 flex-1 leading-snug">{t.title}</span>
          {t.duration_seconds != null && (
            <span data-ui className="shrink-0 text-sm text-ink-soft tabular-nums">
              {formatDuration(t.duration_seconds)}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
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
