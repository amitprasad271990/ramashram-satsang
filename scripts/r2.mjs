// Shared helpers for scripts: Cloudflare R2 client (R2 speaks the S3 protocol)
// and database connection settings.
import { S3Client } from "@aws-sdk/client-s3";

export function r2() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  for (const [k, v] of Object.entries({ R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET })) {
    if (!v) throw new Error(`${k} is missing from .env.local`);
  }
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
  return { client, bucket: R2_BUCKET };
}

/** "local" (files served from .media on this Mac) or "r2" (Cloudflare). */
export const MEDIA_STORAGE = process.env.MEDIA_STORAGE ?? "local";

/** The local Supabase database has no SSL; the cloud one requires it. */
export const dbSsl = () => (/@(127\.0\.0\.1|localhost)[:/]/.test(process.env.DATABASE_URL ?? "") ? false : { rejectUnauthorized: false });

export const CONTENT_TYPES = {
  ".mp3": "audio/mpeg",
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};
