import { pages, type PageSlug } from "@/content";
import { getAnnouncementFor } from "@/lib/data";
import { AnnouncementBar } from "./AnnouncementBar";

/**
 * Standard page frame: announcement bar, then the page content in a white card.
 * `slug` selects which announcement the old page showed.
 */
export async function PageShell({
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
  const announcement = await getAnnouncementFor(slug);
  return (
    <>
      {announcement && <AnnouncementBar text={announcement} announcementKey={pages[slug].announcement!} />}
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
