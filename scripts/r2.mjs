// Shared helpers for scripts: the media bucket (Amazon S3, or any S3-compatible
// service such as Cloudflare R2) and database connection settings.
//
// Settings (in .env.local):
//   MEDIA_STORAGE=s3            ("r2" means the same; "local" = files on this Mac)
//   S3_BUCKET=…                 bucket name (R2_BUCKET also accepted)
//   S3_REGION=ap-south-1        Amazon S3 region
//   S3_ENDPOINT=…               only for non-Amazon services (R2: from R2_ACCOUNT_ID)
// Credentials: S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY (or R2_*) if set;
// otherwise the normal AWS login (`aws login` on this Mac, the IAM role on Amplify).
import { S3Client } from "@aws-sdk/client-s3";

export function s3() {
  const env = process.env;
  const bucket = env.S3_BUCKET || env.R2_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET is missing from .env.local");
  const accessKeyId = env.S3_ACCESS_KEY_ID || env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.S3_SECRET_ACCESS_KEY || env.R2_SECRET_ACCESS_KEY;
  const r2Endpoint = !env.S3_REGION && env.R2_ACCOUNT_ID ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined;
  const client = new S3Client({
    region: env.S3_REGION || "auto",
    endpoint: env.S3_ENDPOINT || r2Endpoint,
    credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
  });
  return { client, bucket };
}

/** Kept for older scripts. */
export const r2 = s3;

/** "local" (files served from .media on this Mac) or "s3" (the bucket). */
export const MEDIA_STORAGE = ["s3", "r2"].includes(process.env.MEDIA_STORAGE ?? "") ? "s3" : "local";

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
