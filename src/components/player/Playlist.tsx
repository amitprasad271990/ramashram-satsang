"use client";

import { useDeferredValue, useId, useMemo, useState } from "react";
import { formatDuration } from "@/lib/format";
import { matches } from "@/lib/search";
import { usePlayer, type PlayerTrack } from "./PlayerProvider";

type Track = PlayerTrack & { duration: number | null };

export function Playlist({ tracks, searchLabel }: { tracks: Track[]; searchLabel?: string }) {
  const player = usePlayer();
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query);
  const shown = useMemo(() => (q.trim() ? tracks.filter((t) => matches(t.title, q)) : tracks), [tracks, q]);
  const searchId = useId();

  return (
    <div className="mt-8">
      {searchLabel && (
        <div data-ui role="search" className="sticky top-[5.15rem] z-10 xl:top-[7.65rem] -mx-1 mb-4 rounded-2xl bg-ivory/95 px-1 py-2 backdrop-blur">
          <label htmlFor={searchId} className="mb-1.5 block font-semibold text-maroon">
            {searchLabel}
          </label>
          <div className="relative">
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-ink-soft" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="नाम का कोई शब्द लिखें…"
              autoComplete="off"
              enterKeyHint="search"
              className="w-full rounded-full border-2 border-sand bg-white py-3 pr-4 pl-12 text-lg outline-none transition placeholder:text-ink-soft/70 focus:border-gold"
            />
          </div>
          <p aria-live="polite" className="mt-1.5 text-sm text-ink-soft">
            {q.trim() ? (shown.length ? `${tracks.length} में से ${shown.length} मिले` : "कुछ नहीं मिला — कोई दूसरा शब्द लिखें") : ""}
          </p>
        </div>
      )}

      <ol className="grid gap-2.5">
        {shown.map((t, i) => {
          const isCurrent = player.current?.id === t.id;
          const isPlaying = isCurrent && player.playing;
          return (
            <li
              key={t.id}
              className={`flex items-center gap-1 rounded-2xl border bg-white pr-2 shadow-[0_1px_2px_rgb(79_17_25/0.05)] transition hover:border-gold hover:shadow-[var(--shadow-card)] ${
                isCurrent ? "border-maroon/60 ring-2 ring-maroon/15" : "border-sand/70"
              }`}
            >
              <button
                type="button"
                onClick={() => player.playFrom(shown, i)}
                aria-current={isCurrent ? "true" : undefined}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-4 py-3 text-left"
              >
                <span
                  aria-hidden
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${
                    isCurrent ? "bg-maroon text-white" : "bg-saffron-soft text-saffron"
                  }`}
                >
                  {isPlaying ? <Bars /> : (
                    <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </span>
                <span className={`min-w-0 flex-1 leading-snug ${isCurrent ? "font-semibold text-maroon" : ""}`}>{t.title}</span>
                <span data-ui className="sr-only">
                  {isPlaying ? " — चल रहा है, रोकने के लिए दबाएँ" : isCurrent ? " — रुका हुआ, चलाने के लिए दबाएँ" : " — चलाएँ"}
                </span>
                {t.duration != null && (
                  <span data-ui className="shrink-0 text-sm text-ink-soft tabular-nums">
                    {formatDuration(t.duration)}
                  </span>
                )}
              </button>
              <a
                data-ui
                href={t.src}
                download
                aria-label={`डाउनलोड करें: ${t.title}`}
                title="डाउनलोड / Download"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-cream hover:text-maroon"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" />
                </svg>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Small moving bars shown on the recording that is playing. */
function Bars() {
  return (
    <span className="flex h-4 items-end gap-[3px]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="eq-bar w-[3px] rounded-full bg-current" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
    </span>
  );
}
