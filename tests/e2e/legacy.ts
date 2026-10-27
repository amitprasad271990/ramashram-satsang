// Reads the old site so tests can compare the new pages against it.
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

export const OLD_SITE = path.resolve(process.env.OLD_SITE ?? "../www.ramashramsatsang.co.in");

/** Remove all whitespace: the comparison is about characters, not spacing or line breaks. */
export const squash = (s: string) => s.replace(/[\s ​]+/g, "");

export function loadOld(file: string) {
  return cheerio.load(fs.readFileSync(path.join(OLD_SITE, file), "utf8"));
}

/** Visible text of an old page's own content (without menu, announcement, counter or footer). */
export function oldContentText(file: string): string {
  const $ = loadOld(file);
  const main = $("div.main").first();
  const root = main.length ? main : $("body");
  root.find("script,style,input,iframe,noscript").remove();
  root.find('img[src="Images/116.gif"]').closest("div").remove();
  root.find("#ctl00_lblcount").closest("table").remove();
  return root.text().replace("Sorry, your browser does not support HTML5 audio.", "");
}

/** Show where two squashed strings first differ. */
export function firstDifference(a: string, b: string): string | null {
  if (a === b) return null;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return `at character ${i}:\n  old: …${a.slice(Math.max(0, i - 40), i + 60)}…\n  new: …${b.slice(Math.max(0, i - 40), i + 60)}…`;
}
