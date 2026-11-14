import type { NextConfig } from "next";
import { PAGES } from "./scripts/page-map.mjs";

const mediaBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;

const nextConfig: NextConfig = {
  // The browser tests build into their own folder so a running `npm run dev` is not disturbed.
  distDir: process.env.NEXT_DIST_DIR || ".next",

  images: {
    // WebP only. AVIF encoding sometimes froze the image resizer under load
    // (a photo then never loaded until the server restarted).
    formats: ["image/webp"],
    // In production, images come from the Cloudflare R2 media address.
    remotePatterns: mediaBase ? [new URL(`${mediaBase.replace(/\/$/, "")}/**`)] : [],
  },

  // Old addresses (e.g. /udeshya.html, /musicnew.aspx) keep working.
  async redirects() {
    return PAGES.flatMap((p) => {
      const base = p.file.replace(/\.html$/, "");
      return [".html", ".aspx"].map((ext) => ({ source: `/${base}${ext}`, destination: p.route, permanent: true }));
    });
  },
};

export default nextConfig;
