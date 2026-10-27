// Copies the text content of the old static site into JSON files under
// src/content/legacy/. Text is taken verbatim from the HTML (never retyped);
// only the old inline styling and layout tables are removed.
//
// Usage: node scripts/extract-content.mjs [path-to-old-site]

import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { PAGES, legacyToRoute } from "./page-map.mjs";

const OLD = path.resolve(process.argv[2] ?? "../www.ramashramsatsang.co.in");
const OUT = path.resolve("src/content/legacy");

// Purely decorative images of the old design; not carried over.
const DECORATIVE = /(116\.gif|121\.gif|Star\.gif|click1\.gif|back\.gif|popup\.jpg)$/;
// Fallback text inside <audio> tags — never visible to visitors.
const AUDIO_FALLBACK = "Sorry, your browser does not support HTML5 audio.";

/** Pixel size of an old-site image (read from the file header). */
const sizes = JSON.parse(fs.readFileSync(path.join(OUT, "image-sizes.json"), "utf8"));
const imageSize = (src) => {
  const s = sizes[src];
  if (!s) throw new Error(`No size recorded for ${src}; run scripts/image-sizes.mjs first`);
  return s;
};

const load = (file) => cheerio.load(fs.readFileSync(path.join(OLD, file), "utf8"));
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const styleOf = (el) => (el.attribs?.style ?? "").replace(/\s+/g, "").toLowerCase();

/** The old page's own content area (between the announcement bar and the footer). */
function contentRoot($) {
  const main = $("div.main").first();
  if (main.length) return main;
  return $("body"); // biography pages have no site chrome
}

/** Convert a node tree to clean HTML, keeping every text node exactly. */
function clean($, node, ctx = {}) {
  if (node.type === "text") {
    const t = node.data.replace(/ +/g, " ");
    return t.includes(AUDIO_FALLBACK) ? "" : esc(t);
  }
  if (node.type !== "tag" && node.type !== "root") return "";
  const kids = () => (node.children ?? []).map((c) => clean($, c, ctx)).join("");
  const tag = node.name;
  const style = styleOf(node);
  const center = /text-align:center/.test(style) || node.attribs?.align === "center";
  const cls = (base) => {
    const c = [base, center && "text-center"].filter(Boolean).join(" ");
    return c ? ` class="${c}"` : "";
  };

  switch (tag) {
    case undefined: // root
      return kids();
    case "script":
    case "style":
    case "audio":
    case "iframe":
    case "noscript":
      return "";
    case "input":
      if (node.attribs?.type === "text") return `<span class="blank"></span>`;
      return ""; // the old "OK" button only showed an alert
    case "img": {
      let src = node.attribs?.src ?? "";
      if (!src || DECORATIVE.test(src)) return "";
      // Biography pages used small thumbnails; the same portraits exist at full size.
      const large = src.replace(/^Images\/th_lights(\d)\.jpg$/, "Images/lights$1.jpg");
      if (large !== src && sizes[large]) src = large;
      const { width, height } = imageSize(src);
      return `<img src="legacy:${src}" width="${width}" height="${height}" alt="">`;
    }
    case "br":
      return "<br>";
    case "p": {
      const inner = kids();
      if (!inner.replace(/<br>|\s/g, "")) return "";
      if (/font-size:(x-)?large/.test(style)) return `<h2${cls()}>${inner}</h2>`;
      if (/text-decoration:underline/.test(style)) return `<h3${cls()}>${inner}</h3>`;
      return `<p${cls()}>${inner}</p>`;
    }
    case "h1":
    case "h2":
    case "h3": {
      // The old pages sometimes wrap whole blocks in <h2>; unwrap those.
      const hasBlock = $(node).find("div,p,ul,table").length > 0;
      return hasBlock ? kids() : `<${tag}${cls()}>${kids()}</${tag}>`;
    }
    case "b":
    case "strong":
      return `<strong>${kids()}</strong>`;
    case "u":
      return `<u>${kids()}</u>`;
    case "ul":
    case "ol":
      return `<${tag}${cls()}>${kids()}</${tag}>`;
    case "li":
      return `<li>${kids()}</li>`;
    case "a": {
      const href = node.attribs?.href;
      const route = href && legacyToRoute(href);
      return route ? `<a href="${route}">${kids()}</a>` : kids();
    }
    case "table": {
      // Tables whose rows have a single cell were only used for layout; unwrap them.
      const rows = $(node).children("tbody").children("tr").add($(node).children("tr"));
      const dataTable = rows.filter((_, tr) => $(tr).children("td").length > 1).length > 0;
      const inner = (node.children ?? []).map((c) => clean($, c, { ...ctx, inTable: dataTable })).join("");
      return dataTable ? `<table>${inner}</table>` : inner;
    }
    case "tbody":
    case "tr":
    case "td":
      return ctx.inTable ? `<${tag}>${kids()}</${tag}>` : kids();
    case "div":
      // Home page: Bhaiya ji's portrait with its caption.
      if (node.attribs?.class === "thumbnail-item") return `<figure class="portrait">${kids()}</figure>`;
      return kids();
    default:
      return kids(); // span, form, font, center …
  }
}

/** Tidy whitespace without touching any visible characters. */
function tidy(html) {
  return html
    .replace(/[ \t\r\n]+/g, " ")
    .replace(/(<br>\s*){3,}/g, "<br><br>")
    .replace(/>\s+</g, "> <")
    .replace(/<(p|h2|h3|li|td)([^>]*)>\s*(<br>\s*)+/g, "<$1$2>")
    .replace(/(\s*<br>)+\s*<\/(p|h2|h3|li|td)>/g, "</$2>")
    .trim();
}

/** Visible text of an old page's content area (used by the comparison test). */
export function legacyText($, root) {
  const r = root.clone();
  r.find("script,style,input,iframe").remove();
  return r.text().replace(AUDIO_FALLBACK, "");
}

function pageHtml(file, { drop = [] } = {}) {
  const $ = load(file);
  const root = contentRoot($);
  for (const sel of drop) root.find(sel).remove();
  // Remove the shared footer block that sits inside div.main on some pages.
  root.find('img[src="Images/116.gif"]').closest("div").remove();
  root.find("#ctl00_lblcount").closest("table").remove();
  const out = tidy(clean($, { type: "root", children: root.get(0).children }));
  return out;
}

function announcementOf(file) {
  const $ = load(file);
  return $("#ctl00_lbldetails").text().trim() || null;
}

function playlist(file) {
  const $ = load(file);
  return $("#playlist li a")
    .map((i, a) => ({ order: i + 1, title: $(a).text(), file: $(a).attr("href") }))
    .get();
}

// ---------------------------------------------------------------------------

fs.mkdirSync(OUT, { recursive: true });

const pages = {};
const announcements = {};
for (const p of PAGES) {
  const ann = announcementOf(p.file);
  let annKey = null;
  if (ann) {
    annKey = Object.keys(announcements).find((k) => announcements[k] === ann);
    if (!annKey) {
      annKey = ann.includes("देहरादून") ? "dehradun" : ann.includes("हरिद्वार") ? "haridwar" : `a${Object.keys(announcements).length}`;
      announcements[annKey] = ann;
    }
  }
  pages[p.slug] = {
    legacyFile: p.file,
    route: p.route,
    announcement: annKey,
    html: p.kind === "prose" ? pageHtml(p.file, p) : null,
  };
}

// Audio lists, in the exact order and wording of the old playlists.
const audio = {
  bhajan: playlist("musicnew.html"),
  amritVani: playlist("samparksutra.html"),
  pravachan: {
    "kolkata-2016": playlist("PravachaKolkata2016.html"),
    "kolkata-2013": playlist("Pravachankolkata.html"),
    "lonavala-2014": playlist("Pravachanlonavala.html"),
    "aurangabad-2013": playlist("Pravachannew.html"),
  },
};

// Headings and intro lines of the audio pages.
const audioPages = {};
for (const [key, file] of Object.entries({
  bhajan: "musicnew.html",
  "kolkata-2016": "PravachaKolkata2016.html",
  "kolkata-2013": "Pravachankolkata.html",
  "lonavala-2014": "Pravachanlonavala.html",
  "aurangabad-2013": "Pravachannew.html",
})) {
  const $ = load(file);
  audioPages[key] = { heading: $("div.main h1").first().text(), intro: $("div.main > p").first().text() };
}

// Shared header of the old site (portrait captions, buttons, quotes).
const $d = load("Default.html");
const textWithBreaks = (el) =>
  $d(el)
    .html()
    .split(/<br\s*\/?>/i)
    .map((s) => cheerio.load(s).text())
    .filter((s) => s.trim());
const headerCells = $d("form > table > tbody > tr > td");
const quotes = $d("a.customGal")
  .map((_, a) => ({
    image: $d(a).attr("href"),
    thumb: $d(a).find("img").attr("src"),
    caption: $d(a).attr("title"),
    name: $d(a).find("img").attr("title"),
  }))
  .get();
const header = {
  siteTitle: $d("title").text().trim(),
  founder: { image: "Images/left2new.jpg", popup: "Images/35.jpg", lines: textWithBreaks(headerCells.eq(0).find("p")) },
  jiyaMaa: { image: "Images/right.jpg", lines: textWithBreaks(headerCells.eq(2).find("p")) },
  dadaGuru: {
    image: "Images/ltop.jpg",
    quote: $d('img[src="Images/ltop.jpg"]').attr("title"),
    lines: textWithBreaks($d('a[style*="font-size:small;"]').filter((_, a) => !$d(a).attr("href")).first()),
  },
  hindiTitle: (() => {
    const $k = load("karyakarini.html"); // inner pages show the Hindi title where Home shows English
    return $k('a[style*="x-large"]').first().text().trim();
  })(),
  englishTitle: $d("a").filter((_, a) => $d(a).text().trim() === "Ramashram Satsang Mathura").text(),
  buttons: $d("ul.navigationTabs a[href]")
    .map((_, a) => ({ label: $d(a).text(), href: legacyToRoute($d(a).attr("href")) }))
    .get()
    .filter((b) => b.label.trim()),
  youtubeChannel: "UCpkrDMw_bvoRqag7wOcvmFA",
  quotes,
  menu: $d("#main-nav a").map((_, a) => ({ label: $d(a).text(), href: legacyToRoute($d(a).attr("href")) })).get(),
  footerLinks: $d("td.samplecss > a").map((_, a) => $d(a).text()).get(),
  copyright: $d("td.samplecss p").text().replace(/\s+/g, " ").trim(),
  homeAudio: "Anar.mp3",
};

// Biography menu (Parichay) and Prakashan book list.
const $par = load("Parichay.html");
const parichay = $par("#tablist a").map((_, a) => ({ label: $par(a).text(), slug: path.basename($par(a).attr("href"), ".html") })).get();
const $pra = load("prakashan.html");
const books = $pra("#tablist a").map((_, a) => ({ label: $pra(a).text(), file: $pra(a).attr("href") })).get();

// Pravachan index banners (their text was inside images; typed out word for word).
const pravachanIndex = [
  { banner: "kolnew_pic.png", label: "कोलकाता शिविर (प्रवचन)", children: [
    { banner: "kolnew1_pic.png", label: "प्रवचन 2016", event: "kolkata-2016" },
    { banner: "kolnew2_pic.png", label: "प्रवचन 2013", event: "kolkata-2013" },
  ] },
  { banner: "aurnew_pic.png", label: "औरंगाबाद शिविर 2013(प्रवचन)", event: "aurangabad-2013" },
  { banner: "lonavala_new1.png", label: "लोणावळा शिविर 2014(प्रवचन)", event: "lonavala-2014" },
  { banner: "bareli_new.png", label: "बरेली शिविर (प्रवचन)", event: null },
];

// Amrit Vani page header and its YouTube link.
const $av = load("samparksutra.html");
const amritVaniPage = {
  heading: $av("div.main p").first().text(),
  image: "Images/Guruji_5x7.jpg",
  youtubeLabel: $av('a[onclick^="openYouTube"]').text(),
  youtubeVideo: "2DcRuPpX1BA",
};

// Mool Sadhana Shivir Kyon: heading + the 18 scanned booklet pages.
const $ky = load("moolsadhanakyon.html");
const kyonHeading = $ky("div.main p").first().text();
const kyonPages = [...new Set($ky('img[src^="img/img"]').map((_, i) => $ky(i).attr("src")).get())];

const write = (name, data) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2) + "\n");
write("pages.json", pages);
write("site.json", { announcements, header, parichay, books, pravachanIndex, amritVaniPage, kyonHeading, kyonPages });
write("audio.json", { pages: audioPages, tracks: audio });

console.log(`Extracted ${Object.keys(pages).length} pages, ${Object.keys(announcements).length} announcements,`,
  `${audio.bhajan.length} bhajans, ${audio.amritVani.length} amrit vani,`,
  `${Object.values(audio.pravachan).flat().length} pravachans → ${path.relative(process.cwd(), OUT)}/`);
