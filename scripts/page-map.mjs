// One entry per page of the old site: its file, its new address, and how it is
// rendered ("prose" = extracted HTML; "custom" = a page with its own layout).
// Shared by the extraction script, redirects (next.config.ts) and tests.

export const PAGES = [
  // The hover-enlargement duplicate of Bhaiya ji's portrait is dropped.
  { slug: "home", file: "Default.html", route: "/", kind: "prose", drop: [".tooltip"] },
  { slug: "parichay", file: "Parichay.html", route: "/parichay", kind: "custom" },
  { slug: "dadaguruji", file: "dadaguruji.html", route: "/parichay/dadaguruji", kind: "prose" },
  { slug: "sriguruji", file: "sriguruji.html", route: "/parichay/sriguruji", kind: "prose" },
  { slug: "jiyama", file: "jiyama.html", route: "/parichay/jiyama", kind: "prose" },
  { slug: "pandiji", file: "pandiji.html", route: "/parichay/pandiji", kind: "prose" },
  { slug: "badebhaiya", file: "badebhaiya.html", route: "/parichay/badebhaiya", kind: "prose" },
  { slug: "chhotebhaiya", file: "chhotebhaiya.html", route: "/parichay/chhotebhaiya", kind: "prose" },
  { slug: "manjhlebhaiya", file: "manjhlebhaiya.html", route: "/parichay/manjhlebhaiya", kind: "prose" },
  { slug: "vartmanguru", file: "vartmanguru.html", route: "/parichay/vartmanguru", kind: "prose" },
  { slug: "babuji", file: "babuji.html", route: "/parichay/babuji", kind: "prose" },
  { slug: "udeshya", file: "udeshya.html", route: "/udeshya", kind: "prose" },
  { slug: "moolsadhana", file: "moolsadhana.html", route: "/moolsadhana", kind: "prose" },
  { slug: "moolsadhanakyon", file: "moolsadhanakyon.html", route: "/moolsadhana-shivir-kyon", kind: "custom" },
  { slug: "karyakarini", file: "karyakarini.html", route: "/karyakarini", kind: "prose" },
  { slug: "prakashan", file: "prakashan.html", route: "/prakashan", kind: "custom" },
  { slug: "sapathpatra", file: "sapathpatra.html", route: "/sadasya-shapath-patra", kind: "prose" },
  { slug: "prsanotary", file: "prsanotary.html", route: "/prashnottari", kind: "prose" },
  { slug: "sankasamadhan", file: "sankasamadhan.html", route: "/shanka-samadhan", kind: "prose" },
  { slug: "samparksutra", file: "samparksutra.html", route: "/amrit-vani", kind: "custom" },
  { slug: "localsatsang", file: "localsatsang.html", route: "/satsang-aayojan", kind: "prose" },
  { slug: "musicnew", file: "musicnew.html", route: "/bhajanmala", kind: "custom" },
  { slug: "Pravachanhold", file: "Pravachanhold.html", route: "/pravachan", kind: "custom" },
  { slug: "PravachaKolkata2016", file: "PravachaKolkata2016.html", route: "/pravachan/kolkata-2016", kind: "custom" },
  { slug: "Pravachankolkata", file: "Pravachankolkata.html", route: "/pravachan/kolkata-2013", kind: "custom" },
  { slug: "Pravachanlonavala", file: "Pravachanlonavala.html", route: "/pravachan/lonavala-2014", kind: "custom" },
  { slug: "Pravachannew", file: "Pravachannew.html", route: "/pravachan/aurangabad-2013", kind: "custom" },
];

/** Map an old-site link (e.g. "udeshya.html") to its new address, or null. */
export function legacyToRoute(href) {
  if (!href) return null;
  const file = href.split(/[?#]/)[0].replace(/^\.?\//, "");
  if (!file.endsWith(".html")) return null;
  const page = PAGES.find((p) => p.file.toLowerCase() === file.toLowerCase());
  return page ? page.route : null;
}
