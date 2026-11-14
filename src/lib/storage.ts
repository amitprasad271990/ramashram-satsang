import "server-only";

// Where uploaded media files (MP3s, photos) are stored.
//
//   MEDIA_STORAGE=local  — on this Mac, in the .uploads/ folder (served by /local-media/…)
//   MEDIA_STORAGE=r2     — Cloudflare R2 / Amazon S3 (any S3-compatible bucket)
//
// The browser sends each file STRAIGHT to storage with a short-lived signed
// address (big pravachan MP3s never pass through the website server's memory).

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const STORAGE = process.env.MEDIA_STORAGE === "r2" ? "r2" : "local";

/** Local uploads live here (not in git). Old-site files stay in .media/. */
export const UPLOAD_DIR = path.resolve(process.cwd(), ".uploads");
const LEGACY_DIR = path.resolve(process.cwd(), ".media");

const UPLOAD_MINUTES = 15;

export const LIMITS = {
  audio: { maxBytes: 300 * 1024 * 1024, contentType: "audio/mpeg", ext: "mp3" },
  photo: { maxBytes: 15 * 1024 * 1024, contentType: "image/jpeg", ext: "jpg" },
} as const;
export type MediaKind = keyof typeof LIMITS;

/** A new, unguessable storage key, e.g. uploads/audio/bhajan/2f1c….mp3 */
export function newKey(kind: MediaKind, folder: string): string {
  if (!/^[a-z0-9-]{1,64}$/.test(folder)) throw new Error("bad folder");
  return `uploads/${kind}/${folder}/${randomUUID()}.${LIMITS[kind].ext}`;
}

/** True for keys this app created (the only keys uploads may write to). */
export function isUploadKey(key: string, kind: MediaKind, folder: string): boolean {
  const re = new RegExp(`^uploads/${kind}/${folder}/[0-9a-f-]{36}\\.${LIMITS[kind].ext}$`);
  return re.test(key);
}

// ---------- signed addresses for the browser's upload ----------

function secret(): string {
  const s = process.env.SUPABASE_SECRET_KEY;
  if (!s) throw new Error("SUPABASE_SECRET_KEY is missing");
  return createHmac("sha256", s).update("local-upload-v1").digest("hex");
}

function sign(key: string, exp: number, size: number): string {
  return createHmac("sha256", secret()).update(`${key}|${exp}|${size}`).digest("hex");
}

/** Check a local upload address made by uploadTarget() (used by the upload route). */
export function verifyLocalUpload(key: string, exp: number, size: number, sig: string): boolean {
  if (!(exp > Date.now() / 1000)) return false;
  const want = Buffer.from(sign(key, exp, size), "hex");
  const got = Buffer.from(sig, "hex");
  return want.length === got.length && timingSafeEqual(want, got);
}

/** Where the browser should PUT the file. */
export async function uploadTarget(key: string, kind: MediaKind, size: number) {
  const { contentType, maxBytes } = LIMITS[kind];
  if (!(size > 0 && size <= maxBytes)) throw new Error("size");
  const exp = Math.floor(Date.now() / 1000) + UPLOAD_MINUTES * 60;
  if (STORAGE === "local") {
    const q = new URLSearchParams({ key, exp: String(exp), size: String(size), sig: sign(key, exp, size) });
    return { url: `/admin/api/upload?${q}`, headers: { "Content-Type": contentType } };
  }
  const { client, bucket } = s3();
  const url = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType, ContentLength: size, CacheControl: "public, max-age=31536000, immutable" }),
    { expiresIn: UPLOAD_MINUTES * 60 },
  );
  return { url, headers: { "Content-Type": contentType } };
}

// ---------- file operations ----------

/** Absolute path of a local file, refusing anything outside the media folders. */
export function localPath(key: string): string {
  const base = key.startsWith("uploads/") ? UPLOAD_DIR : LEGACY_DIR;
  const rel = key.startsWith("uploads/") ? key.slice("uploads/".length) : key;
  const p = path.resolve(base, rel);
  if (!p.startsWith(base + path.sep)) throw new Error("bad path");
  return p;
}

/** Size in bytes, or null if the file is not there. */
export async function objectSize(key: string): Promise<number | null> {
  if (STORAGE === "local") {
    try {
      return (await fs.stat(localPath(key))).size;
    } catch {
      return null;
    }
  }
  const { client, bucket } = s3();
  try {
    const r = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return r.ContentLength ?? null;
  } catch {
    return null;
  }
}

/**
 * Delete a stored file. On this Mac, old-site files in .media/ are links to
 * the old site folder: removing the link never touches the original file.
 */
export async function deleteObject(key: string): Promise<void> {
  if (STORAGE === "local") {
    await fs.rm(localPath(key), { force: true });
    return;
  }
  const { client, bucket } = s3();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

function s3() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, S3_ENDPOINT, S3_REGION } = process.env;
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) throw new Error("Storage keys are missing (R2_* in the environment)");
  const client = new S3Client({
    // Cloudflare R2 by default; Amazon S3 when S3_REGION is set (and no endpoint).
    region: S3_REGION || "auto",
    endpoint: S3_ENDPOINT || (S3_REGION ? undefined : `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`),
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
  return { client, bucket: R2_BUCKET };
}
