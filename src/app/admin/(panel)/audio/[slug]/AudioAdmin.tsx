"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatDuration } from "@/lib/format";
import { deleteTrack, moveTrack, renameTrack, saveTrack, startAudioUpload } from "../../../media-actions";
import { inputClass } from "../../../ui";
import { UploadQueue } from "../../../UploadQueue";
import { audioDuration, putFile, titleFromFile } from "../../../upload-client";

export function AudioUploader({ collection }: { collection: string }) {
  const router = useRouter();
  return (
    <UploadQueue
      label="MP3 अपलोड करें / Upload MP3s"
      hint="एक साथ कई फ़ाइलें चुन सकते हैं। नाम फ़ाइल के नाम से बनेगा — बाद में बदल सकते हैं। / You can pick many files; the title comes from the file name and can be changed later."
      accept="audio/mpeg,.mp3"
      onFile={async (file, progress) => {
        if (!/\.mp3$/i.test(file.name) && file.type !== "audio/mpeg") throw new Error("केवल MP3 फ़ाइलें / Only MP3 files");
        const duration = await audioDuration(file);
        const start = await startAudioUpload(collection, file.size);
        if (!start.ok) throw new Error(start.error);
        await putFile(start.url, start.headers, file, progress).catch(() => {
          throw new Error("अपलोड नहीं हुआ — इंटरनेट जाँचें / Upload failed — check the connection");
        });
        const saved = await saveTrack({ collection, key: start.key, title: titleFromFile(file.name), duration });
        if (!saved.ok) throw new Error(saved.error);
        router.refresh();
      }}
    />
  );
}

type Track = { id: string; title: string; src: string; duration: number | null };

export function TrackEditor({ track, first, last }: { track: Track; first: boolean; last: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState(track.title);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const changed = title.trim() !== track.title;

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg?: string) =>
    start(async () => {
      const r = await fn();
      setMessage(r.ok ? (okMsg ?? null) : (r.error ?? "त्रुटि / Error"));
      router.refresh();
    });

  return (
    <li className={`rounded-3xl border border-sand bg-white p-4 shadow-[var(--shadow-card)] sm:p-5 ${pending ? "opacity-60" : ""}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (changed) run(() => renameTrack(track.id, title), "✓ नाम सहेजा / Title saved");
        }}
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <label className="min-w-0 flex-1">
          <span className="text-sm text-ink-soft">
            नाम / Title {track.duration != null && <span className="tabular-nums">· {formatDuration(track.duration)}</span>}
          </span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} required className={inputClass} />
        </label>
        {changed && (
          <button type="submit" disabled={pending} className="rounded-full bg-maroon px-5 py-3 font-semibold text-white hover:bg-maroon-deep">
            सहेजें / Save
          </button>
        )}
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <audio controls preload="none" src={track.src} className="h-10 min-w-0 flex-1 basis-56" />
        <SmallButton label="ऊपर करें / Move up" disabled={first || pending} onClick={() => run(() => moveTrack(track.id, -1))}>
          ↑
        </SmallButton>
        <SmallButton label="नीचे करें / Move down" disabled={last || pending} onClick={() => run(() => moveTrack(track.id, 1))}>
          ↓
        </SmallButton>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm(`"${track.title}" हटाएँ?\nDelete this recording? This cannot be undone.`)) run(() => deleteTrack(track.id));
          }}
          className="rounded-full border-2 border-maroon/20 px-4 py-2 text-sm font-semibold text-maroon hover:bg-maroon hover:text-white"
        >
          हटाएँ / Delete
        </button>
      </div>
      {message && (
        <p role="status" className="mt-2 text-sm font-semibold text-maroon">
          {message}
        </p>
      )}
    </li>
  );
}

function SmallButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full border-2 border-sand text-lg font-bold text-maroon hover:bg-saffron-soft disabled:opacity-30"
    >
      {children}
    </button>
  );
}
