"use client";

// Photo grid + full-screen viewer.
// Viewer: swipe left/right on phones, arrow keys / Escape on computers, and
// the phone's Back button closes it (instead of leaving the album).

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Photo } from "@/lib/data";

type GalleryPhoto = Photo & { src: string };

export function PhotoGallery({ title, photos }: { title: string; photos: GalleryPhoto[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const lastButton = useRef<HTMLButtonElement | null>(null);
  const alt = (i: number) => photos[i].caption ?? `${title} — चित्र ${i + 1}`;

  const show = (i: number, el: HTMLButtonElement) => {
    lastButton.current = el;
    history.pushState({ photoViewer: true }, "");
    setOpen(i);
  };

  // Close = go back one step in history (that also handles the phone's Back button).
  const close = useCallback(() => {
    if (history.state?.photoViewer) history.back();
    else setOpen(null);
  }, []);

  useEffect(() => {
    const onPop = () => setOpen(null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Return keyboard focus to the photo that was opened.
  useEffect(() => {
    if (open === null) lastButton.current?.focus({ preventScroll: true });
  }, [open]);

  return (
    <>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {photos.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={(e) => show(i, e.currentTarget)}
              className="group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl border border-sand/70 bg-white shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-saffron"
              aria-label={`${alt(i)} — बड़ा देखें`}
            >
              <Image
                src={p.src}
                alt=""
                fill
                loading={i < 8 ? "eager" : "lazy"} // the top of the album appears at once
                sizes="(min-width: 1024px) 17rem, (min-width: 640px) 31vw, 46vw"
                className="object-cover object-top transition duration-500 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>
      {photos.length === 0 && <p data-ui className="mt-10 text-center text-ink-soft">इस एल्बम में अभी कोई चित्र नहीं है।</p>}

      {open !== null && (
        <Viewer photos={photos} index={open} alt={alt} onIndex={setOpen} onClose={close} />
      )}
    </>
  );
}

function Viewer({
  photos,
  index,
  alt,
  onIndex,
  onClose,
}: {
  photos: GalleryPhoto[];
  index: number;
  alt: (i: number) => string;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number; dx: number } | null>(null);
  const [dx, setDx] = useState(0);
  const p = photos[index];
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;
  const prev = useCallback(() => hasPrev && onIndex(index - 1), [hasPrev, index, onIndex]);
  const next = useCallback(() => hasNext && onIndex(index + 1), [hasNext, index, onIndex]);

  useEffect(() => {
    dialog.current?.focus();
    const body = document.body.style;
    const before = body.overflow;
    body.overflow = "hidden"; // the page behind does not scroll
    return () => {
      body.overflow = before;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  // Load the neighbours in advance so swiping feels instant.
  const neighbours = [photos[index - 1], photos[index + 1]].filter(Boolean);

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={alt(index)}
      tabIndex={-1}
      data-ui
      className="fixed inset-0 z-50 flex flex-col bg-[#140708] text-white outline-none"
      onTouchStart={(e) => {
        if (e.touches.length === 1) touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0 };
      }}
      onTouchMove={(e) => {
        if (!touch.current || e.touches.length !== 1) return;
        const mx = e.touches[0].clientX - touch.current.x;
        const my = e.touches[0].clientY - touch.current.y;
        if (Math.abs(mx) > Math.abs(my)) {
          touch.current.dx = mx; // read on touchend (state may not have updated yet)
          setDx(mx);
        }
      }}
      onTouchEnd={() => {
        const moved = touch.current?.dx ?? 0;
        if (moved > 60) prev();
        else if (moved < -60) next();
        touch.current = null;
        setDx(0);
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="text-sm tabular-nums text-white/80" aria-live="polite">
          {index + 1} / {photos.length}
        </p>
        <div className="flex items-center gap-1">
          <a
            href={p.src}
            download
            className="grid h-11 w-11 place-items-center rounded-full text-white/85 transition hover:bg-white/10 hover:text-white"
            aria-label="डाउनलोड करें"
            title="डाउनलोड / Download"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" />
            </svg>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full text-white/85 transition hover:bg-white/10 hover:text-white"
            aria-label="बंद करें"
            title="बंद करें / Close"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <Image
          key={p.id}
          src={p.src}
          alt={alt(index)}
          fill
          sizes="100vw"
          quality={85}
          priority
          className="object-contain px-2 transition-transform duration-75 sm:px-20"
          style={{ transform: dx ? `translateX(${dx}px)` : undefined }}
        />
        <NavButton side="left" label="पिछला चित्र" onClick={prev} disabled={!hasPrev} />
        <NavButton side="right" label="अगला चित्र" onClick={next} disabled={!hasNext} />
      </div>

      {p.caption && <p className="px-4 py-3 text-center text-white/90">{p.caption}</p>}
      <div className="h-[env(safe-area-inset-bottom)]" />

      <div aria-hidden className="hidden">
        {neighbours.map((n) => (
          <Image key={n.id} src={n.src} alt="" width={n.width} height={n.height} sizes="100vw" quality={85} />
        ))}
      </div>
    </div>
  );
}

function NavButton({ side, label, onClick, disabled }: { side: "left" | "right"; label: string; onClick: () => void; disabled: boolean }) {
  if (disabled) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`absolute top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/60 ${
        side === "left" ? "left-2 sm:left-5" : "right-2 sm:right-5"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={side === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}
