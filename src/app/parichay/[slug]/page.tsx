import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LegacyHtml } from "@/components/LegacyHtml";
import { PageShell } from "@/components/PageShell";
import { pages, site, type PageSlug } from "@/content";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return site.parichay.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: site.parichay.find((p) => p.slug === slug)?.label };
}

export default async function BiographyPage({ params }: Props) {
  const { slug } = await params;
  const index = site.parichay.findIndex((p) => p.slug === slug);
  if (index < 0) notFound();
  const prev = site.parichay[index - 1];
  const next = site.parichay[index + 1];

  return (
    // The old biography pages opened inside the Parichay page, under its announcement.
    <PageShell slug="parichay">
      <LegacyHtml html={pages[slug as PageSlug].html!} />
      <nav data-ui aria-label="परिचय" className="mt-10 grid grid-cols-2 gap-3 border-t border-sand pt-6 text-[0.9rem]">
        {prev ? (
          <Link href={`/parichay/${prev.slug}`} className="rounded-2xl bg-cream px-4 py-3 text-maroon transition hover:bg-saffron-soft">
            ‹ {prev.label}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/parichay/${next.slug}`} className="rounded-2xl bg-cream px-4 py-3 text-right text-maroon transition hover:bg-saffron-soft">
            {next.label} ›
          </Link>
        )}
      </nav>
    </PageShell>
  );
}
