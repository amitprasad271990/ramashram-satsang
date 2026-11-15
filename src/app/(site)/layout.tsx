import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PlayerProvider } from "@/components/player/PlayerProvider";

// Pages are pre-built and cached. Admin changes refresh them at once on a single
// server, but AWS Amplify runs several server copies that keep their own copy:
// rebuilding each page at most once a minute makes new bhajans, photos and albums
// appear everywhere within about a minute. (The announcement line also updates
// itself in the browser within seconds — see AnnouncementBar.)
export const revalidate = 60;

/** Public pages: menu at the top, footer at the bottom. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      <a
        href="#main"
        data-ui
        className="sr-only z-50 rounded-lg bg-maroon px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        मुख्य सामग्री पर जाएँ
      </a>
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </PlayerProvider>
  );
}
