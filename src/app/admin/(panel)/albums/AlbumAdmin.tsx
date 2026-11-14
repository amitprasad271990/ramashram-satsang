"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAlbum, deleteAlbum, deletePhoto, movePhoto, renameAlbum, savePhoto, startPhotoUpload } from "../../media-actions";
import { inputClass, primaryButton, secondaryButton } from "../../ui";
import { UploadQueue } from "../../UploadQueue";
import { preparePhoto, putFile } from "../../upload-client";

export function NewAlbumForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await createAlbum(title);
          if (!r.ok) return setError(r.error);
          router.push(`/admin/albums/${r.id}`);
        });
      }}
      className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-[var(--shadow-card)] sm:flex-row sm:items-end"
    >
      <label className="flex-1">
        <span className="font-semibold">नया एल्बम / New album</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="जैसे: हरिद्वार शिविर 2026" maxLength={200} required className={inputClass} />
      </label>
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "…" : "बनाएँ / Create"}
      </button>
      {error && (
        <p role="alert" className="font-semibold text-maroon sm:basis-full">
          {error}
        </p>
      )}
    </form>
  );
}

export function AlbumSettings({ id, title, count }: { id: string; title: string; count: number }) {
  const router = useRouter();
  const [value, setValue] = useState(title);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="rounded-3xl bg-white p-5 shadow-[var(--shadow-card)]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await renameAlbum(id, value);
            setMessage(r.ok ? "✓ नाम सहेजा / Name saved" : r.error);
            router.refresh();
          });
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <label className="flex-1">
          <span className="font-semibold">एल्बम का नाम / Album name</span>
          <input value={value} onChange={(e) => setValue(e.target.value)} maxLength={200} required className={inputClass} />
        </label>
        <button type="submit" disabled={pending || value.trim() === title} className={primaryButton}>
          सहेजें / Save
        </button>
      </form>
      {message && (
        <p role="status" className="mt-2 text-sm font-semibold text-maroon">
          {message}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-ink-soft tabular-nums">{count} चित्र / photos</span>
        <Link href={`/photo-album/${id}`} target="_blank" className={secondaryButton}>
          वेबसाइट पर देखें / View on site ↗
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm(`"${title}" एल्बम और इसके सभी ${count} चित्र हटाएँ?\nDelete this album and all its photos? This cannot be undone.`)) return;
            start(async () => {
              const r = await deleteAlbum(id);
              if (!r.ok) return setMessage(r.error);
              router.push("/admin/albums");
              router.refresh();
            });
          }}
          className="rounded-full border-2 border-maroon/20 px-4 py-2 font-semibold text-maroon hover:bg-maroon hover:text-white"
        >
          एल्बम हटाएँ / Delete album
        </button>
      </div>
    </div>
  );
}

export function PhotoUploader({ albumId }: { albumId: string }) {
  const router = useRouter();
  return (
    <UploadQueue
      label="चित्र अपलोड करें / Upload photos"
      hint="एक साथ कई चित्र चुन सकते हैं। बड़े चित्र अपने आप छोटे (2400 px) हो जाते हैं। / Pick many at once; large photos are resized to 2400 px automatically."
      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
      onFile={async (file, progress) => {
        if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) throw new Error("केवल चित्र / Only photos");
        let prepared;
        try {
          prepared = await preparePhoto(file);
        } catch {
          throw new Error("यह चित्र खुल नहीं सका (JPG या PNG चुनें) / This photo could not be read (choose JPG or PNG)");
        }
        const start = await startPhotoUpload(albumId, prepared.blob.size);
        if (!start.ok) throw new Error(start.error);
        await putFile(start.url, start.headers, prepared.blob, progress).catch(() => {
          throw new Error("अपलोड नहीं हुआ — इंटरनेट जाँचें / Upload failed — check the connection");
        });
        const saved = await savePhoto({ albumId, key: start.key, width: prepared.width, height: prepared.height });
        if (!saved.ok) throw new Error(saved.error);
      }}
      onAllDone={() => router.refresh()}
    />
  );
}

export function PhotoTile({ id, src, n, first, last }: { id: string; src: string; n: number; first: boolean; last: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) alert(r.error);
      router.refresh();
    });
  return (
    <li className={`overflow-hidden rounded-2xl border border-sand bg-white shadow-[var(--shadow-card)] ${pending ? "opacity-50" : ""}`}>
      <div className="relative aspect-[3/4] bg-cream">
        <Image src={src} alt={`चित्र ${n}`} fill sizes="(min-width: 1024px) 15rem, 45vw" className="object-cover object-top" />
        <span className="absolute top-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-xs text-white tabular-nums">{n}</span>
      </div>
      <div className="flex items-center justify-between gap-1 p-2">
        <div className="flex gap-1">
          <TileButton label="पहले / Earlier" disabled={first || pending} onClick={() => run(() => movePhoto(id, -1))}>
            ←
          </TileButton>
          <TileButton label="बाद में / Later" disabled={last || pending} onClick={() => run(() => movePhoto(id, 1))}>
            →
          </TileButton>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => confirm(`चित्र ${n} हटाएँ?\nDelete this photo? This cannot be undone.`) && run(() => deletePhoto(id))}
          className="rounded-full border-2 border-maroon/20 px-3 py-1.5 text-sm font-semibold text-maroon hover:bg-maroon hover:text-white"
          aria-label={`चित्र ${n} हटाएँ / Delete photo ${n}`}
        >
          हटाएँ
        </button>
      </div>
    </li>
  );
}

function TileButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-full border-2 border-sand font-bold text-maroon hover:bg-saffron-soft disabled:opacity-30"
    >
      {children}
    </button>
  );
}
