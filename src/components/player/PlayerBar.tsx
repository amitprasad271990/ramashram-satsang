"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/format";
import { usePlayer } from "./PlayerProvider";

const SPEEDS = [1, 1.25, 1.5, 0.75];

/** The player bar fixed to the bottom of the screen while something is loaded. */
export function PlayerBar() {
  const p = usePlayer();
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragging, setDragging] = useState<number | null>(null);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const a = p.audio.current;
    if (!a) return;
    const onTime = () => setTime(a.currentTime);
    const onDur = () => setDuration(Number.isFinite(a.duration) ? a.duration : 0);
    const onLoad = () => {
      a.playbackRate = speed; // a new recording keeps the chosen speed
      onDur();
    };
    onTime();
    onDur();
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("durationchange", onDur);
    a.addEventListener("loadedmetadata", onLoad);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("durationchange", onDur);
      a.removeEventListener("loadedmetadata", onLoad);
    };
  }, [p.audio, speed]);

  const t = p.current!;
  const shown = dragging ?? time;

  const changeSpeed = () => {
    const s = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(s);
    if (p.audio.current) p.audio.current.playbackRate = s;
  };

  return (
    <section
      data-ui
      aria-label="ऑडियो प्लेयर"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-gold/60 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-10px_rgb(79_17_25/0.35)] backdrop-blur"
    >
      <div className="mx-auto grid max-w-6xl gap-x-6 gap-y-1.5 px-4 pt-2.5 pb-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-center sm:py-3">
        {/* What is playing */}
        <div className="flex min-w-0 items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 leading-snug font-semibold text-ink sm:line-clamp-1" title={t.title}>
              {t.title}
            </p>
            <Link href={t.href} className="block truncate text-sm text-maroon underline-offset-2 hover:underline">
              {t.album}
            </Link>
          </div>
          <CloseButton onClick={p.close} className="sm:hidden" />
        </div>

        {/* Controls + position */}
        <div className="grid gap-1">
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <IconButton label="15 सेकंड पीछे" onClick={() => p.skip(-15)}>
              <path d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z" />
              <text x="12" y="16.2" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="currentColor">15</text>
            </IconButton>
            <IconButton label="पिछला" onClick={p.prev}>
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </IconButton>
            <button
              type="button"
              onClick={p.toggle}
              aria-label={p.playing ? "रोकें" : "चलाएँ"}
              className="mx-1 grid h-12 w-12 place-items-center sm:h-14 sm:w-14 rounded-full bg-maroon text-white shadow-md transition hover:bg-maroon-deep focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-saffron"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
                {p.playing ? <path d="M6 5h4v14H6zm8 0h4v14h-4z" /> : <path d="M8 5v14l11-7z" />}
              </svg>
            </button>
            <IconButton label="अगला" onClick={p.next} disabled={!p.hasNext}>
              <path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" />
            </IconButton>
            <IconButton label="15 सेकंड आगे" onClick={() => p.skip(15)}>
              <path d="M12 5V2l5 4-5 4V7a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z" />
              <text x="12" y="16.2" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="currentColor">15</text>
            </IconButton>
          </div>

          <div className="flex items-center gap-2 text-xs text-ink-soft tabular-nums sm:text-sm">
            <span className="w-11 text-right sm:w-12">{formatDuration(Math.floor(shown))}</span>
            <input
              type="range"
              aria-label="कहाँ से सुनें"
              aria-valuetext={`${formatDuration(Math.floor(shown))} / ${formatDuration(Math.floor(duration))}`}
              min={0}
              max={duration || 0}
              step={1}
              value={Math.min(shown, duration || 0)}
              disabled={!duration}
              onChange={(e) => setDragging(Number(e.target.value))}
              onPointerUp={() => commit()}
              onKeyUp={() => commit()}
              onBlur={() => commit()}
              className="h-2 flex-1 cursor-pointer accent-[var(--color-maroon)]"
            />
            <span className="w-11 sm:w-12">{duration ? formatDuration(Math.floor(duration)) : "--:--"}</span>
            <SpeedButton speed={speed} onClick={changeSpeed} className="sm:hidden" />
          </div>
          {p.failed && (
            <p role="alert" className="text-center text-sm font-semibold text-maroon">
              यह ऑडियो अभी नहीं चल पा रहा है। / This recording could not be played.
            </p>
          )}
        </div>

        {/* Speed + close */}
        <div className="hidden items-center gap-2 sm:flex">
          <SpeedButton speed={speed} onClick={changeSpeed} />
          <CloseButton onClick={p.close} />
        </div>
      </div>
    </section>
  );

  function commit() {
    if (dragging == null) return;
    if (p.audio.current) p.audio.current.currentTime = dragging;
    setTime(dragging);
    setDragging(null);
  }
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-11 w-11 place-items-center rounded-full text-maroon transition hover:bg-saffron-soft disabled:opacity-35 disabled:hover:bg-transparent"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
        {children}
      </svg>
    </button>
  );
}

function SpeedButton({ speed, onClick, className = "" }: { speed: number; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`गति ${speed} गुना — बदलें`}
      title="गति / Speed"
      className={`shrink-0 rounded-full border border-sand px-3 py-1 text-sm font-semibold text-ink-soft tabular-nums transition hover:border-gold hover:text-maroon ${className}`}
    >
      {speed}×
    </button>
  );
}

function CloseButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="प्लेयर बंद करें"
      title="बंद करें / Close"
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-cream hover:text-maroon ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  );
}
