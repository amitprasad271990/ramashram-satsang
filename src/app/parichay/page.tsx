import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { bioImage, imageSize, site, type PageSlug } from "@/content";
import { mediaUrl } from "@/lib/media";

export const metadata: Metadata = { title: "परिचय" };

export default function ParichayPage() {
  return (
    <PageShell slug="parichay" wide card={false}>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
        {site.parichay.map((p) => {
          const img = bioImage(p.slug as PageSlug);
          const size = imageSize(img);
          return (
            <li key={p.slug}>
              <Link
                href={`/parichay/${p.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-sand/70 bg-white shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-b from-cream to-saffron-soft/60 p-4">
                  <Image
                    src={mediaUrl(img)}
                    width={size.width}
                    height={size.height}
                    alt=""
                    sizes="(min-width: 640px) 18rem, 45vw"
                    className="h-full w-auto max-w-full rounded-2xl border-4 border-white object-cover shadow-md transition duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <span className="flex flex-1 items-center justify-center border-t-4 border-gold px-3 py-4 text-center font-[family-name:var(--font-display)] text-lg leading-snug text-maroon sm:text-xl">
                  {p.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </PageShell>
  );
}
