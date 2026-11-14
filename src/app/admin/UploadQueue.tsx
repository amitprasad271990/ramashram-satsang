"use client";

// A file picker + a list showing each file's upload progress.
// Files are uploaded one after another (gentle on phone connections).

import { useId, useRef, useState } from "react";
import { primaryButton } from "./ui";
import { formatBytes } from "./upload-client";

export type QueueItem = { name: string; size: number; progress: number; state: "waiting" | "working" | "done" | "error"; error?: string };

export function UploadQueue({
  label,
  hint,
  accept,
  onFile,
  onAllDone,
}: {
  label: string;
  hint: string;
  accept: string;
  /** upload one file; call progress(0..1); throw an Error with a message on failure */
  onFile: (file: File, progress: (p: number) => void) => Promise<void>;
  onAllDone?: () => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);

  const update = (i: number, patch: Partial<QueueItem>) => setItems((list) => list.map((it, k) => (k === i ? { ...it, ...patch } : it)));

  async function start(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    setItems(files.map((f) => ({ name: f.name, size: f.size, progress: 0, state: "waiting" })));
    for (const [i, f] of files.entries()) {
      update(i, { state: "working" });
      try {
        await onFile(f, (p) => update(i, { progress: p }));
        update(i, { state: "done", progress: 1 });
      } catch (e) {
        update(i, { state: "error", error: e instanceof Error ? e.message : String(e) });
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    onAllDone?.();
  }

  const done = items.filter((i) => i.state === "done").length;

  return (
    <section className="rounded-3xl border-2 border-dashed border-gold/70 bg-white p-5 sm:p-6">
      <label htmlFor={id} className="block font-semibold text-maroon">
        {label}
      </label>
      <p className="mt-1 text-sm text-ink-soft">{hint}</p>
      <input
        ref={input}
        id={id}
        type="file"
        multiple
        accept={accept}
        disabled={busy}
        onChange={(e) => start(Array.from(e.target.files ?? []))}
        className="sr-only"
      />
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className={`${primaryButton} mt-4`}>
        {busy ? `अपलोड हो रहा है… ${done}/${items.length} / Uploading…` : "फ़ाइलें चुनें / Choose files"}
      </button>

      {items.length > 0 && (
        <ul className="mt-4 grid gap-2" aria-live="polite">
          {items.map((it, i) => (
            <li key={i} className="rounded-2xl bg-ivory px-4 py-2.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{it.name}</span>
                <span className="shrink-0 tabular-nums text-ink-soft">
                  {it.state === "done" ? "✓ हो गया / Done" : it.state === "error" ? "✗" : it.state === "waiting" ? "प्रतीक्षा / Waiting" : `${Math.round(it.progress * 100)}%`}
                  {" · "}
                  {formatBytes(it.size)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand/60">
                <div
                  className={`h-full rounded-full transition-[width] ${it.state === "error" ? "bg-red-600" : it.state === "done" ? "bg-[#2f7d32]" : "bg-saffron"}`}
                  style={{ width: `${Math.round((it.state === "error" ? 1 : it.progress) * 100)}%` }}
                />
              </div>
              {it.error && <p className="mt-1 text-sm font-semibold text-maroon">{it.error}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
