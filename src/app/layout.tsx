import type { Metadata, Viewport } from "next";
import { Noto_Serif_Devanagari, Tiro_Devanagari_Hindi } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { site } from "@/content";
import "./globals.css";

const body = Noto_Serif_Devanagari({
  variable: "--font-noto-serif-devanagari",
  subsets: ["devanagari", "latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const display = Tiro_Devanagari_Hindi({
  variable: "--font-tiro-devanagari",
  subsets: ["devanagari", "latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: site.header.siteTitle, template: `%s | ${site.header.hindiTitle}` },
  description: site.header.hindiTitle,
};

export const viewport: Viewport = {
  themeColor: "#7b1e2b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hi" className={`${body.variable} ${display.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          data-ui
          className="sr-only z-50 rounded-lg bg-maroon px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          मुख्य सामग्री पर जाएँ
        </a>
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
