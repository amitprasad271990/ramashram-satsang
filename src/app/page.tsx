import Image from "next/image";
import Link from "next/link";
import { LegacyHtml } from "@/components/LegacyHtml";
import { Divider } from "@/components/Ornaments";
import { AnnouncementBar } from "@/components/PageShell";
import { Portrait } from "@/components/Portrait";
import { announcementFor, imageSize, pages, site } from "@/content";
import { mediaUrl } from "@/lib/media";

const h = site.header;

export default function HomePage() {
  const announcement = announcementFor("home");
  const poster = imageSize(h.founder.popup);

  return (
    <>
      {/* Hero: the old site's header — portraits, title and buttons */}
      <section data-compare="header" className="relative overflow-hidden bg-maroon-deep text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(900px 420px at 50% 0%, rgb(217 122 31 / 0.45), transparent 70%), radial-gradient(600px 400px at 10% 100%, rgb(201 160 74 / 0.25), transparent 70%)",
          }}
        />
        <HeroMandala />
        <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-12 sm:px-6 sm:pt-14 sm:pb-16">
          <h1 className="text-center font-[family-name:var(--font-display)] text-3xl tracking-wide text-gold-light sm:text-5xl">
            {h.englishTitle}
          </h1>
          <Divider className="mx-auto mt-4 max-w-xs" />

          <div className="mt-10 grid grid-cols-2 items-end gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-6">
            <Portrait image={h.founder.image} lines={h.founder.lines} />
            <div className="order-first col-span-2 sm:order-none sm:col-span-1">
              <Portrait image={h.dadaGuru.image} lines={h.dadaGuru.lines} size="lg" />
            </div>
            <Portrait image={h.jiyaMaa.image} lines={h.jiyaMaa.lines} />
          </div>

          <nav aria-label="सत्संग" className="mt-12">
            <ul className="flex flex-wrap items-center justify-center gap-3">
              {h.buttons.slice(0, 3).map((b) => (
                <li key={b.href}>
                  <Link
                    href={b.href}
                    className="block rounded-full border border-gold/70 bg-white/10 px-5 py-2.5 text-gold-light backdrop-blur transition hover:-translate-y-0.5 hover:bg-gold hover:text-maroon-deep"
                  >
                    {b.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={`https://www.youtube.com/channel/${h.youtubeChannel}/live`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-[#e62117] px-5 py-2.5 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#c41a12]"
                >
                  <span aria-hidden className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                  live
                </a>
              </li>
            </ul>
            <p className="mt-6 text-center">
              <Link
                href={h.buttons[3].href}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-saffron to-gold px-6 py-3.5 font-semibold text-maroon-deep shadow-[0_10px_30px_-10px_rgb(217_122_31/0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-10px_rgb(217_122_31/0.9)]"
              >
                <span aria-hidden>✦</span>
                {h.buttons[3].label}
                <span aria-hidden>✦</span>
              </Link>
            </p>
          </nav>
        </div>
      </section>

      {announcement && <AnnouncementBar text={announcement} />}

      <main id="main" className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 sm:pt-12">
        {/* Anar.mp3 played automatically (hidden) on the old home page; now a visible player, no autoplay */}
        <div data-ui className="mx-auto mb-8 flex max-w-md items-center gap-3 rounded-full border border-gold/50 bg-white px-4 py-2 shadow-[var(--shadow-card)]">
          <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-saffron" fill="currentColor" aria-hidden>
            <path d="M12 3v10.6A4 4 0 1 0 14 17V7h4V3z" />
          </svg>
          <audio controls preload="none" src={mediaUrl(h.homeAudio)} className="h-10 w-full" />
        </div>

        <article className="rounded-3xl border border-sand/70 bg-white px-5 py-8 shadow-[var(--shadow-card)] sm:px-10 sm:py-12">
          <LegacyHtml html={pages.home.html!} className="flow-root" />
        </article>

        {/* Sayings of the gurus (captions of the old header's photo gallery) */}
        <section data-compare="header" className="mt-14">
          <Divider className="mx-auto mb-10 max-w-md" />
          <figure className="mx-auto mb-10 max-w-3xl rounded-3xl bg-gradient-to-br from-maroon to-maroon-deep p-6 text-center text-white shadow-[var(--shadow-card)] sm:p-10">
            <svg viewBox="0 0 32 32" className="mx-auto h-8 w-8 text-gold" fill="currentColor" aria-hidden>
              <path d="M9.3 25C5.5 25 3 22 3 18.2 3 12 7.6 7.3 13.6 6l.9 2c-3.6 1.3-5.7 3.7-6.1 6.4 3.4-.4 6 1.9 6 5.2 0 3-2.3 5.4-5.1 5.4zm15.4 0c-3.8 0-6.3-3-6.3-6.8 0-6.2 4.6-10.9 10.6-12.2l.9 2c-3.6 1.3-5.7 3.7-6.1 6.4 3.4-.4 6 1.9 6 5.2 0 3-2.3 5.4-5.1 5.4z" />
            </svg>
            <blockquote className="mt-4 font-[family-name:var(--font-display)] text-xl leading-relaxed sm:text-2xl">
              {h.dadaGuru.quote}
            </blockquote>
          </figure>

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {h.quotes.map((q) => {
              const size = imageSize(q.image);
              return (
                <li
                  key={q.image}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-sand/70 bg-white shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
                >
                  <div className="relative bg-cream">
                    <Image
                      src={mediaUrl(q.image)}
                      width={size.width}
                      height={size.height}
                      alt={q.name.trim()}
                      sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 90vw"
                      className="mx-auto h-72 w-auto object-contain transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <p className="flex-1 border-t-4 border-gold px-5 py-5 text-[0.95rem] leading-relaxed">{q.caption}</p>
                </li>
              );
            })}
          </ul>

          <figure className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-3xl border-4 border-white shadow-[var(--shadow-card)] ring-1 ring-gold/50">
            <Image
              src={mediaUrl(h.founder.popup)}
              width={poster.width}
              height={poster.height}
              alt=""
              sizes="(min-width: 768px) 48rem, 100vw"
              className="h-auto w-full"
            />
          </figure>
        </section>
      </main>
    </>
  );
}

/** Faint mandala pattern behind the hero (decorative). */
function HeroMandala() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 400"
      className="pointer-events-none absolute top-1/2 left-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 text-gold opacity-[0.07]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      {Array.from({ length: 24 }, (_, i) => (
        <ellipse key={i} cx="200" cy="200" rx="190" ry="60" transform={`rotate(${i * 7.5} 200 200)`} />
      ))}
      <circle cx="200" cy="200" r="190" />
      <circle cx="200" cy="200" r="60" />
    </svg>
  );
}
