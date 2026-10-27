import Link from "next/link";
import { FOOTER_LINKS, site } from "@/content";
import { LotusMark } from "./Ornaments";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-maroon-deep text-gold-light">
      <div className="h-1 bg-gradient-to-r from-saffron via-gold to-saffron" aria-hidden />
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-4 py-10 text-center">
        <LotusMark className="h-12 w-12 text-gold-light" />
        <nav aria-label="फुटर">
          <ul className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
            {FOOTER_LINKS.map((l, i) => (
              <li key={l.label} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden className="text-gold/60">|</span>}
                <Link href={l.href} className="rounded px-1 font-semibold text-white transition-colors hover:text-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-sm leading-relaxed text-gold-light/80">{site.header.copyright}</p>
      </div>
    </footer>
  );
}
