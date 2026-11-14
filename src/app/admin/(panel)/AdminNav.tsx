"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", hi: "मुख्य", en: "Home" },
  { href: "/admin/shapath-patra", hi: "शपथ पत्र", en: "Pledges" },
  { href: "/admin/announcement", hi: "सूचना", en: "Announcement" },
  { href: "/admin/audio", hi: "ऑडियो", en: "Audio" },
  { href: "/admin/albums", hi: "फोटो एल्बम", en: "Albums" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="w-full">
      <ul className="flex flex-wrap gap-1.5 sm:gap-2">
        {ITEMS.map((i) => {
          const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className="block rounded-full px-4 py-2 whitespace-nowrap text-ink hover:bg-saffron-soft aria-[current=page]:bg-maroon aria-[current=page]:text-white"
              >
                {i.hi} <span className="opacity-70">/ {i.en}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
