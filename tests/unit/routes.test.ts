import { describe, expect, it } from "vitest";
import { legacyToRoute, PAGES } from "../../scripts/page-map.mjs";
import { mediaUrl } from "@/lib/media";

describe("legacyToRoute", () => {
  it("maps every old page to a unique new address", () => {
    const routes = PAGES.map((p) => legacyToRoute(p.file));
    expect(routes.every(Boolean)).toBe(true);
    expect(new Set(routes).size).toBe(PAGES.length);
  });
  it("is case-insensitive and ignores non-page links", () => {
    expect(legacyToRoute("default.html")).toBe("/");
    expect(legacyToRoute("samparksutra.html")).toBe("/amrit-vani");
    expect(legacyToRoute("bhajan/1.mp3")).toBeNull();
    expect(legacyToRoute("#")).toBeNull();
  });
});

describe("mediaUrl", () => {
  it("serves old-site files from /legacy in development", () => {
    expect(mediaUrl("Images/right.jpg")).toBe("/legacy/Images/right.jpg");
    expect(mediaUrl("/bhajan/0.mp3")).toBe("/legacy/bhajan/0.mp3");
  });
});
