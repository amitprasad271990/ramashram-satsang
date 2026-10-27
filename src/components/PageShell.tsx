import { announcementFor, type PageSlug } from "@/content";

/** The shivir announcement line (a scrolling marquee on the old site). */
export function AnnouncementBar({ text }: { text: string }) {
  return (
    <div className="border-b border-gold/40 bg-gradient-to-r from-saffron-soft via-[#fdf0dc] to-saffron-soft">
      <div className="mx-auto flex max-w-5xl items-start gap-3 px-4 py-3 sm:px-6">
        <svg viewBox="0 0 24 24" className="mt-1 h-6 w-6 shrink-0 text-saffron" aria-hidden fill="currentColor">
          {/* diya */}
          <path d="M12 2c1.6 2 2.4 3.6 2.4 5a2.4 2.4 0 1 1-4.8 0C9.6 5.6 10.4 4 12 2z" />
          <path d="M2 12.5h20c-.6 4.2-4.8 7.5-10 7.5S2.6 16.7 2 12.5z" opacity=".85" />
        </svg>
        <p className="text-[0.95rem] leading-relaxed font-semibold text-maroon-deep">{text}</p>
      </div>
    </div>
  );
}

/**
 * Standard page frame: announcement bar, then the page content in a white card.
 * `slug` selects which announcement the old page showed.
 */
export function PageShell({
  slug,
  children,
  wide = false,
  card = true,
}: {
  slug: PageSlug;
  children: React.ReactNode;
  wide?: boolean;
  card?: boolean;
}) {
  const announcement = announcementFor(slug);
  return (
    <>
      {announcement && <AnnouncementBar text={announcement} />}
      <main id="main" className={`mx-auto px-4 pt-8 sm:px-6 sm:pt-12 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
        {card ? (
          <div className="rounded-3xl border border-sand/70 bg-white px-5 py-8 shadow-[var(--shadow-card)] sm:px-10 sm:py-12">
            {children}
          </div>
        ) : (
          children
        )}
      </main>
    </>
  );
}
