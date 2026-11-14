import type { Metadata, Viewport } from "next";
import { Noto_Serif_Devanagari, Tiro_Devanagari_Hindi } from "next/font/google";
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
      <body className="flex min-h-dvh flex-col antialiased">{children}</body>
    </html>
  );
}
