"use client";

// One audio player for the whole site. It lives in the site layout, so a
// bhajan keeps playing while the visitor moves between pages.
//
// Notes:
// * play() is called directly inside the tap/click handler (iPhone Safari
//   only allows sound to start from a user's tap).
// * Long recordings (pravachan, amrit vani) remember where the listener
//   stopped, in this browser only.
// * Lock-screen / headphone buttons work through the Media Session API.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { PlayerBar } from "./PlayerBar";

export type PlayerTrack = {
  id: string;
  title: string;
  src: string;
  album: string; // the playlist's heading, e.g. "भजनमाला"
  href: string; // the playlist's page
};

type PlayerApi = {
  current: PlayerTrack | null;
  playing: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  failed: boolean;
  audio: React.RefObject<HTMLAudioElement | null>;
  /** Play `tracks[index]` (or pause/resume it if it is already the current track). */
  playFrom: (tracks: PlayerTrack[], index: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  skip: (seconds: number) => void;
  close: () => void;
};

const PlayerContext = createContext<PlayerApi | null>(null);

export function usePlayer(): PlayerApi {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
}

const LONG = 10 * 60; // recordings longer than 10 minutes remember their position
const posKey = (id: string) => `ramashram:pos:${id}`;

function readPos(id: string): number {
  try {
    return Number(localStorage.getItem(posKey(id))) || 0;
  } catch {
    return 0;
  }
}
function writePos(id: string, seconds: number | null) {
  try {
    if (seconds == null) localStorage.removeItem(posKey(id));
    else localStorage.setItem(posKey(id), String(Math.floor(seconds)));
  } catch {}
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<PlayerTrack[]>([]);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  // Event handlers read the latest queue from here (no stale closures).
  const live = useRef({ queue, index });
  live.current = { queue, index };

  const current = queue[index] ?? null;

  const load = useCallback((tracks: PlayerTrack[], i: number) => {
    const a = audio.current;
    const t = tracks[i];
    if (!a || !t) return;
    live.current = { queue: tracks, index: i };
    setQueue(tracks);
    setIndex(i);
    setFailed(false);
    const resume = readPos(t.id);
    a.src = resume > 30 ? `${t.src}#t=${resume}` : t.src;
    a.play().catch(() => {}); // a refused autoplay simply leaves it paused
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.album, album: "रामाश्रम सत्संग, मथुरा" });
    }
  }, []);

  const playFrom = useCallback(
    (tracks: PlayerTrack[], i: number) => {
      const a = audio.current;
      const { queue: q, index: cur } = live.current;
      if (a && q[cur] && q[cur].id === tracks[i]?.id) {
        if (a.paused) a.play().catch(() => {});
        else a.pause();
        return;
      }
      load(tracks, i);
    },
    [load],
  );

  const toggle = useCallback(() => {
    const a = audio.current;
    if (!a || !a.src) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }, []);

  const next = useCallback(() => {
    const { queue: q, index: i } = live.current;
    if (i < q.length - 1) load(q, i + 1);
  }, [load]);

  const prev = useCallback(() => {
    const a = audio.current;
    const { queue: q, index: i } = live.current;
    // Like most players: "previous" first restarts the current recording.
    if (a && a.currentTime > 5) a.currentTime = 0;
    else if (i > 0) load(q, i - 1);
    else if (a) a.currentTime = 0;
  }, [load]);

  const skip = useCallback((s: number) => {
    const a = audio.current;
    if (!a || !Number.isFinite(a.duration)) return;
    a.currentTime = Math.min(Math.max(0, a.currentTime + s), a.duration - 0.5);
  }, []);

  const close = useCallback(() => {
    const a = audio.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    setIndex(-1);
    setQueue([]);
    if ("mediaSession" in navigator) navigator.mediaSession.metadata = null;
  }, []);

  // Audio element events.
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    let lastSave = 0;
    const id = () => live.current.queue[live.current.index]?.id;
    const onPlay = () => {
      setPlaying(true);
      // Only one sound at a time: pause any other <audio> on the page.
      document.querySelectorAll("audio").forEach((el) => el !== a && el.pause());
    };
    const onPause = () => {
      setPlaying(false);
      const t = id();
      if (t && a.duration > LONG) writePos(t, a.currentTime);
    };
    const onTime = () => {
      const t = id();
      if (!t || !(a.duration > LONG) || Math.abs(a.currentTime - lastSave) < 5) return;
      lastSave = a.currentTime;
      writePos(t, a.currentTime);
    };
    const onEnded = () => {
      const t = id();
      if (t) writePos(t, null);
      const { queue: q, index: i } = live.current;
      if (i < q.length - 1) load(q, i + 1);
    };
    const onError = () => {
      if (a.getAttribute("src")) setFailed(true);
    };
    // Another player on the page (e.g. the home page recording) starts: pause ours.
    const onAnyPlay = (e: Event) => {
      if (e.target instanceof HTMLMediaElement && e.target !== a) a.pause();
    };
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnded);
    a.addEventListener("error", onError);
    document.addEventListener("play", onAnyPlay, true);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("error", onError);
      document.removeEventListener("play", onAnyPlay, true);
    };
  }, [load]);

  // Lock-screen and headphone buttons.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    const set = (action: MediaSessionAction, fn: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(action, fn);
      } catch {}
    };
    set("play", toggle);
    set("pause", toggle);
    set("previoustrack", prev);
    set("nexttrack", next);
    set("seekbackward", () => skip(-15));
    set("seekforward", () => skip(15));
    set("seekto", (d) => {
      if (audio.current && d.seekTime != null) audio.current.currentTime = d.seekTime;
    });
  }, [toggle, prev, next, skip]);

  const api = useMemo<PlayerApi>(
    () => ({
      current,
      playing,
      failed,
      hasPrev: index > 0,
      hasNext: index >= 0 && index < queue.length - 1,
      audio,
      playFrom,
      toggle,
      next,
      prev,
      skip,
      close,
    }),
    [current, playing, failed, index, queue.length, playFrom, toggle, next, prev, skip, close],
  );

  return (
    <PlayerContext.Provider value={api}>
      {children}
      <audio ref={audio} id="site-player" preload="metadata" className="hidden" />
      {current && (
        <>
          <div aria-hidden className="h-32 bg-maroon-deep sm:h-28" /> {/* room so the bar never covers the footer */}
          <PlayerBar />
        </>
      )}
    </PlayerContext.Provider>
  );
}
