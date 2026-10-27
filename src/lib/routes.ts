import { PAGES } from "../../scripts/page-map.mjs";
import { MENU, QUICK_LINKS, site, type PageSlug } from "@/content";

export type PageInfo = { slug: PageSlug; file: string; route: string; kind: "prose" | "custom" };
export const ALL_PAGES = PAGES as PageInfo[];

/** Top-level text pages rendered by app/[page] (e.g. /udeshya). */
export const TOP_LEVEL_PROSE = ALL_PAGES.filter(
  (p) => p.kind === "prose" && p.route !== "/" && p.route.split("/").length === 2,
);

/** Browser-tab title for a page, taken from its menu label. */
export function titleFor(route: string): string | undefined {
  const fromMenu = [...MENU, ...QUICK_LINKS].find((m) => m.href === route)?.label;
  const fromParichay = site.parichay.find((p) => `/parichay/${p.slug}` === route)?.label;
  return (fromMenu ?? fromParichay)?.replace(/\|/g, "").trim();
}
