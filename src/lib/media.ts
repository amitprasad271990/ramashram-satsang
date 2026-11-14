// Media files (images, MP3s, PDFs) never live in git. In development they are
// served from public/legacy (a link to the old site folder); in production
// NEXT_PUBLIC_MEDIA_BASE_URL points at the Cloudflare R2 bucket.

// `||` (not `??`): an empty value in .env.local also means "local".
const BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "/legacy").replace(/\/$/, "");

/** Public URL of a media file given its path in the old site, e.g. "Images/right.jpg". */
export function mediaUrl(path: string): string {
  return `${BASE}/${path.replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/")}`;
}
