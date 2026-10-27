import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { site } from "@/content";

export const metadata: Metadata = { title: "प्रवचन" };

type Entry = { label: string; event?: string | null; children?: Entry[] };

/** The old page's picture banners, now as cards with the same words. */
export default function PravachanIndexPage() {
  return (
    <PageShell slug="Pravachanhold" card={false}>
      <ul data-transcribed className="grid gap-5">
        {(site.pravachanIndex as Entry[]).map((e) => (
          <li key={e.label} className="overflow-hidden rounded-3xl border border-sand/70 bg-white shadow-[var(--shadow-card)]">
            {e.children ? (
              <>
                <h2 className={bannerClass}>{e.label}</h2>
                <ul className="grid grid-cols-2 gap-3 p-4">
                  {e.children.map((c) => (
                    <li key={c.label}>
                      <Link
                        href={`/pravachan/${c.event}`}
                        className="block rounded-2xl border border-gold/50 bg-cream px-4 py-4 text-center text-lg text-maroon transition hover:-translate-y-0.5 hover:bg-saffron-soft"
                      >
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : e.event ? (
              <Link href={`/pravachan/${e.event}`} className={`${bannerClass} block transition hover:brightness-110`}>
                {e.label}
              </Link>
            ) : (
              // This banner did not link anywhere on the old site.
              <p className={`${bannerClass} opacity-80`}>{e.label}</p>
            )}
          </li>
        ))}
      </ul>
    </PageShell>
  );
}

const bannerClass =
  "bg-gradient-to-r from-maroon-deep via-maroon to-maroon-deep px-5 py-6 text-center font-[family-name:var(--font-display)] text-2xl text-gold-light sm:text-3xl";
