"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MENU, QUICK_LINKS, site } from "@/content";
import { LotusMark } from "./Ornaments";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  // Where the phone menu starts: just below the header (its height changes with text size).
  const [menuTop, setMenuTop] = useState(64);

  // Close the mobile menu whenever the page changes.
  useEffect(() => setOpen(false), [pathname]);

  // While the phone menu is open: lock page scrolling, and Escape closes it.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggleMenu() {
    if (!open && headerRef.current) setMenuTop(Math.max(0, Math.round(headerRef.current.getBoundingClientRect().bottom)));
    setOpen((v) => !v);
  }

  return (
    <>
    <header ref={headerRef} className="sticky top-0 z-40 border-b border-gold/40 bg-ivory/90 backdrop-blur-md supports-[backdrop-filter]:bg-ivory/80">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5">
          <LotusMark className="h-10 w-10 shrink-0 text-maroon transition-transform duration-500 group-hover:rotate-[8deg]" />
          <span className="font-[family-name:var(--font-display)] text-[1.05rem] leading-snug text-maroon sm:text-xl">
            {site.header.hindiTitle}
          </span>
        </Link>

        <nav aria-label="मुख्य मेनू" className="ml-auto hidden xl:block">
          <ul className="flex items-center gap-0.5">
            {MENU.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className="relative block rounded-full px-2.5 py-1.5 text-[0.8rem] whitespace-nowrap text-ink transition-colors hover:bg-saffron-soft hover:text-maroon aria-[current=page]:bg-maroon aria-[current=page]:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          data-ui
          onClick={toggleMenu}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "मेनू बंद करें" : "मेनू खोलें"}
          className="ml-auto grid h-12 w-12 shrink-0 place-items-center rounded-full text-maroon transition-colors hover:bg-saffron-soft xl:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {/* The old header's buttons (||सत्संग आयोजन|| …) — kept on every page */}
      <div className="hidden border-t border-gold/25 bg-cream/70 xl:block">
        <ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-6 py-1.5 text-[0.8rem]">
          {QUICK_LINKS.map((b) => (
            <li key={b.href}>
              <Link
                href={b.href}
                aria-current={isActive(pathname, b.href) ? "page" : undefined}
                className="text-maroon transition-colors hover:text-saffron aria-[current=page]:font-bold"
              >
                {b.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

    </header>

      {/* Phone menu. It must stay OUTSIDE <header>: the header's blur (backdrop-filter)
          would make "fixed" relative to the header and squash this panel to zero height. */}
      <div
        id="mobile-menu"
        hidden={!open}
        style={{ top: menuTop }}
        className="fixed inset-x-0 bottom-0 z-50 overflow-y-auto overscroll-contain border-t border-gold/40 bg-ivory xl:hidden"
      >
        <nav aria-label="मुख्य मेनू" className="mx-auto max-w-lg px-4 pt-3 pb-10">
          <ul className="grid gap-1.5">
            {MENU.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-lg shadow-[var(--shadow-card)] aria-[current=page]:bg-maroon aria-[current=page]:text-white"
                >
                  {item.label}
                  <span aria-hidden className="text-gold">›</span>
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-5 grid gap-1.5 border-t border-gold/40 pt-5">
            {QUICK_LINKS.map((b) => (
              <li key={b.href}>
                <Link
                  href={b.href}
                  className="block rounded-xl border border-gold/50 bg-saffron-soft/60 px-4 py-3 text-center text-maroon"
                >
                  {b.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
