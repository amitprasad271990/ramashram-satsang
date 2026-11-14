import type { Metadata, Viewport } from "next";
// Fonts are bundled with the site (no download from Google while building):
// each file covers Hindi or Latin letters and the browser loads only what a page needs.
import "@fontsource/noto-serif-devanagari/400.css";
import "@fontsource/noto-serif-devanagari/600.css";
import "@fontsource/noto-serif-devanagari/700.css";
import "@fontsource/tiro-devanagari-hindi/400.css";
import { site } from "@/content";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: site.header.siteTitle, template: `%s | ${site.header.hindiTitle}` },
  description: site.header.hindiTitle,
};

export const viewport: Viewport = {
  themeColor: "#7b1e2b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hi">
      <body className="flex min-h-dvh flex-col antialiased">{children}</body>
    </html>
  );
}
