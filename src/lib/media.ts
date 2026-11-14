// Media files (images, MP3s, PDFs) never live in git.
//
// * Going live: NEXT_PUBLIC_MEDIA_BASE_URL is the bucket's public address and
//   every file (old-site files and admin uploads) is served from there.
// * On this Mac (base address empty): old-site files come from /legacy
//   (public/legacy → .media) and admin uploads from /local-media (.uploads).

// `||` (not `??`): an empty value in .env.local also means "local".
const BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "").replace(/\/$/, "");

const encode = (p: string) => p.split("/").map(encodeURIComponent).join("/");

/** Public URL of a media file given its storage key, e.g. "Images/right.jpg". */
export function mediaUrl(key: string): string {
  const clean = key.replace(/^\/+/, "");
  if (BASE) return `${BASE}/${encode(clean)}`;
  if (clean.startsWith("uploads/")) return `/local-media/${encode(clean.slice("uploads/".length))}`;
  return `/legacy/${encode(clean)}`;
}
