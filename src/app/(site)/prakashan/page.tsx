import type { Metadata } from "next";
import Image from "next/image";
import { PageShell } from "@/components/PageShell";
import { imageSize, site } from "@/content";
import {
  PRAKASHAN_ADDRESS,
  PRAKASHAN_ADDRESS_LABEL,
  PRAKASHAN_NOTE,
  PRAKASHAN_NOTE_LABEL,
  PRAKASHAN_PARAGRAPHS,
} from "@/content/prakashan-transcript";
import { mediaUrl } from "@/lib/media";

export const metadata: Metadata = { title: "प्रकाशन" };

const ORIGINAL_IMAGE = "prakashan.png"; // converted from prakashan.bmp

export default function PrakashanPage() {
  const original = imageSize("prakashan.bmp");
  return (
    <PageShell slug="prakashan" wide card={false}>
      <ul className="grid gap-4 sm:grid-cols-2">
        {site.books.map((b) => (
          <li
            key={b.file}
            className="flex flex-col rounded-3xl border border-sand/70 bg-white p-5 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)]"
          >
            <div className="flex items-start gap-4">
              <BookIcon />
              <h2 className="font-[family-name:var(--font-display)] text-xl leading-snug text-maroon">{b.label}</h2>
            </div>
            <div data-ui className="mt-5 grid grid-cols-2 gap-2">
              <a
                href={mediaUrl(b.file)}
                target="_blank"
                rel="noopener"
                className="rounded-full bg-maroon px-4 py-2.5 text-center text-white transition hover:bg-maroon-deep"
              >
                पढ़ें
              </a>
              <a
                href={mediaUrl(b.file)}
                download
                className="rounded-full border border-maroon/40 px-4 py-2.5 text-center text-maroon transition hover:bg-saffron-soft"
              >
                डाउनलोड
              </a>
            </div>
          </li>
        ))}
      </ul>

      <article className="mt-8 rounded-3xl border border-sand/70 bg-white px-5 py-8 shadow-[var(--shadow-card)] sm:px-10 sm:py-10">
        <div data-transcribed className="legacy-content">
          {PRAKASHAN_PARAGRAPHS.map((p) => (
            <p key={p.slice(0, 20)}>{p}</p>
          ))}
          <div className="rounded-2xl bg-cream px-5 py-4">
            <p className="text-left">
              <strong>{PRAKASHAN_ADDRESS_LABEL}</strong>
            </p>
            <address className="mt-1 not-italic">
              {PRAKASHAN_ADDRESS.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </address>
          </div>
          <p>
            <strong>{PRAKASHAN_NOTE_LABEL}</strong> {PRAKASHAN_NOTE}
          </p>
        </div>
        <figure className="mt-10 overflow-x-auto rounded-2xl border border-sand">
          <Image
            src={mediaUrl(ORIGINAL_IMAGE)}
            width={original.width}
            height={original.height}
            alt=""
            sizes="(min-width: 1024px) 60rem, 100vw"
            className="h-auto w-full min-w-[36rem]"
          />
        </figure>
      </article>
    </PageShell>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10 shrink-0 text-saffron" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
      <path d="M9 8h7M9 11.5h5" strokeLinecap="round" />
    </svg>
  );
}
