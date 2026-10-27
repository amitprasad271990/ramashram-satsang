// Decorative SVGs (no text). Marked aria-hidden so screen readers skip them.

export function LotusMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden fill="none">
      <circle cx="24" cy="24" r="22.5" stroke="var(--color-gold)" strokeWidth="1.5" />
      <g fill="currentColor">
        <path d="M24 9c3.6 4.2 5.4 8.9 5.4 13.2 0 4.6-2.2 8.6-5.4 11.3-3.2-2.7-5.4-6.7-5.4-11.3C18.6 17.9 20.4 13.2 24 9z" />
        <path opacity=".75" d="M11.5 17.5c4.7.7 8.7 3.1 11 6.6 1.6 2.4 2.3 5.4 1.5 8.9-3.6-.4-6.8-2.1-8.8-5-2.2-3-3.5-6.6-3.7-10.5z" />
        <path opacity=".75" d="M36.5 17.5c-.2 3.9-1.5 7.5-3.7 10.5-2 2.9-5.2 4.6-8.8 5-.8-3.5-.1-6.5 1.5-8.9 2.3-3.5 6.3-5.9 11-6.6z" />
      </g>
      <path d="M12 36.5c3.6 1.6 7.6 2.4 12 2.4s8.4-.8 12-2.4" stroke="var(--color-saffron)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** A thin gold divider with a small diamond in the middle. */
export function Divider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/70 to-gold/70" />
      <svg viewBox="0 0 12 12" className="h-3 w-3 text-gold">
        <path d="M6 0l6 6-6 6-6-6z" fill="currentColor" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-gold/70 to-gold/70" />
    </div>
  );
}
