"use client";

import { useEffect, useState } from "react";

/**
 * The shivir announcement line (a scrolling marquee on the old site).
 *
 * Pages are pre-built and cached, and on AWS Amplify an admin's "refresh"
 * does not reach every server copy. So after the page loads, the browser asks
 * the database for the current line directly (visitors may read it) and shows
 * it if it has changed. A saved announcement therefore appears within seconds.
 */
export function AnnouncementBar({ text, announcementKey }: { text: string; announcementKey: string }) {
  const [current, setCurrent] = useState(text);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!base || !key) return;
    const ctrl = new AbortController();
    const url = `${base}/rest/v1/announcements?select=text&key=eq.${encodeURIComponent(announcementKey)}`;
    fetch(url, { headers: { apikey: key }, cache: "no-store", signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((rows: { text?: unknown }[] | null) => {
        const t = rows?.[0]?.text;
        if (typeof t === "string" && t.trim()) setCurrent(t);
      })
      .catch(() => {}); // offline or blocked: keep the line the page came with
    return () => ctrl.abort();
  }, [announcementKey]);

  return (
    <div
      data-announcement={announcementKey}
      className="border-b border-gold/40 bg-gradient-to-r from-saffron-soft via-[#fdf0dc] to-saffron-soft"
    >
      <div className="mx-auto flex max-w-5xl items-start gap-3 px-4 py-3 sm:px-6">
        <svg viewBox="0 0 24 24" className="mt-1 h-6 w-6 shrink-0 text-saffron" aria-hidden fill="currentColor">
          {/* diya */}
          <path d="M12 2c1.6 2 2.4 3.6 2.4 5a2.4 2.4 0 1 1-4.8 0C9.6 5.6 10.4 4 12 2z" />
          <path d="M2 12.5h20c-.6 4.2-4.8 7.5-10 7.5S2.6 16.7 2 12.5z" opacity=".85" />
        </svg>
        <p className="text-[0.95rem] leading-relaxed font-semibold text-maroon-deep">{current}</p>
      </div>
    </div>
  );
}
