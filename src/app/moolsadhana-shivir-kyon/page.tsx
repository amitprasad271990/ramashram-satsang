import type { Metadata } from "next";
import Image from "next/image";
import { PageShell } from "@/components/PageShell";
import { imageSize, site } from "@/content";
import { mediaUrl } from "@/lib/media";

export const metadata: Metadata = { title: site.kyonHeading.replace(/\s+/g, " ") };

/** The 18 scanned pages of the booklet, one below the other (easy to read on phones). */
export default function ShivirKyonPage() {
  return (
    <PageShell slug="moolsadhanakyon">
      <div className="legacy-content">
        <h2 className="text-center">{site.kyonHeading}</h2>
      </div>
      <ol className="mt-8 grid gap-6">
        {site.kyonPages.map((src, i) => {
          const { width, height } = imageSize(src);
          return (
            <li key={src}>
              <Image
                src={mediaUrl(src)}
                width={width}
                height={height}
                alt=""
                sizes="(min-width: 768px) 36rem, 92vw"
                priority={i === 0}
                className="mx-auto h-auto w-full max-w-xl rounded-xl border border-sand shadow-[var(--shadow-card)]"
              />
              <p data-ui className="mt-2 text-center text-sm text-ink-soft">
                {i + 1} / {site.kyonPages.length}
              </p>
            </li>
          );
        })}
      </ol>
    </PageShell>
  );
}
