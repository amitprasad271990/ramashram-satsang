// Typed access to the text extracted from the old site (src/content/legacy/*.json).
// Regenerate those files with `npm run extract`; never edit them by hand.

import pagesJson from "./legacy/pages.json";
import siteJson from "./legacy/site.json";
import audioJson from "./legacy/audio.json";
import imageSizes from "./legacy/image-sizes.json";

export type PageSlug = keyof typeof pagesJson;

export const pages = pagesJson;
export const site = siteJson;
export const audio = audioJson;

export type PravachanEvent = keyof typeof audioJson.tracks.pravachan;

/** Pixel size of an old-site image, e.g. "Images/right.jpg". */
export function imageSize(path: string): { width: number; height: number } {
  const size = (imageSizes as Record<string, { width: number; height: number }>)[path];
  if (!size) throw new Error(`Unknown image: ${path}`);
  return size;
}

/** The main menu, plus the photo album added at the end. */
export const MENU = [...site.header.menu, { label: "फोटो एल्बम", href: "/photo-album" }];

/** Home-page buttons of the old header (||सत्संग आयोजन|| etc.), shown on every page. */
export const QUICK_LINKS = site.header.buttons;

/** Footer links; "सम्पर्क पता" points to the Sampark Sutra (Amrit Vani) page. */
export const FOOTER_LINKS = site.header.footerLinks.map((label) => ({
  label,
  href: ({ "मुख्यपृष्ठ": "/", "मूल साधना": "/moolsadhana", "उद्देश्य": "/udeshya", "सम्पर्क पता": "/amrit-vani" } as Record<string, string>)[label],
}));

/** The portrait shown on a biography page (the first image in its text). */
export function bioImage(slug: PageSlug): string {
  return pages[slug].html!.match(/src="legacy:([^"]+)"/)![1];
}
