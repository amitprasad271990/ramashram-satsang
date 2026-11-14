import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegacyHtml } from "@/components/LegacyHtml";
import { PageShell } from "@/components/PageShell";
import { pages } from "@/content";
import { TOP_LEVEL_PROSE, titleFor } from "@/lib/routes";

type Props = { params: Promise<{ page: string }> };

// Unknown addresses get notFound() below. (`false` here breaks the refresh after an admin edit in Next 15.)
export const dynamicParams = true;

export function generateStaticParams() {
  return TOP_LEVEL_PROSE.map((p) => ({ page: p.route.slice(1) }));
}

const find = (page: string) => TOP_LEVEL_PROSE.find((p) => p.route === `/${page}`);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  return { title: titleFor(`/${page}`) };
}

export default async function ProsePage({ params }: Props) {
  const info = find((await params).page);
  if (!info) notFound();
  return (
    <PageShell slug={info.slug}>
      <LegacyHtml html={pages[info.slug].html!} />
    </PageShell>
  );
}
