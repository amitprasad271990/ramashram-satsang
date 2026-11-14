import { describe, expect, it, vi } from "vitest";
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

describe("mediaUrl with an empty setting", () => {
  it("still serves from /legacy when NEXT_PUBLIC_MEDIA_BASE_URL is empty", async () => {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_BASE_URL", "");
    vi.resetModules();
    const { mediaUrl: fresh } = await import("@/lib/media");
    expect(fresh("Images/right.jpg")).toBe("/legacy/Images/right.jpg");
    vi.unstubAllEnvs();
  });
});

describe("mediaUrl for admin uploads", () => {
  it("serves uploads from /local-media on this Mac", () => {
    expect(mediaUrl("uploads/audio/bhajan/ab12.mp3")).toBe("/local-media/audio/bhajan/ab12.mp3");
  });
  it("serves everything from the bucket when a base address is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_BASE_URL", "https://media.example.org/");
    vi.resetModules();
    const { mediaUrl: fresh } = await import("@/lib/media");
    expect(fresh("uploads/photo/a/x.jpg")).toBe("https://media.example.org/uploads/photo/a/x.jpg");
    expect(fresh("Images/right.jpg")).toBe("https://media.example.org/Images/right.jpg");
    vi.unstubAllEnvs();
  });
});
