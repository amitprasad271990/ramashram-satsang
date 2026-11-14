// Uploads the prepared media folder (.media/, see prepare-media.mjs) to the
// Cloudflare R2 bucket, keeping the old site's file paths. Files already in the
// bucket with the same size are skipped, so it is safe to re-run after a break.
//
// Usage: npm run media:upload

import fs from "node:fs";
import path from "node:path";
import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { CONTENT_TYPES, MEDIA_STORAGE, r2 } from "./r2.mjs";

if (MEDIA_STORAGE !== "r2") {
  console.log("MEDIA_STORAGE is not \"r2\": media is served from .media on this computer; nothing to upload.");
  process.exit(0);
}

const SRC = path.resolve(".media");
if (!fs.existsSync(SRC)) throw new Error("Run `npm run media` first to prepare .media/");

const { client, bucket } = r2();
const files = fs
  .readdirSync(SRC, { recursive: true })
  .map((f) => f.split(path.sep).join("/"))
  .filter((f) => fs.statSync(path.join(SRC, f)).isFile());

const totalBytes = files.reduce((n, f) => n + fs.statSync(path.join(SRC, f)).size, 0);
let doneBytes = 0;
let uploaded = 0;
let skipped = 0;
const failed = [];

async function alreadyThere(key, size) {
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return head.ContentLength === size;
  } catch {
    return false;
  }
}

async function upload(key) {
  const file = path.join(SRC, key);
  const size = fs.statSync(file).size;
  if (await alreadyThere(key, size)) {
    skipped++;
  } else {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fs.readFileSync(file),
        ContentLength: size,
        ContentType: CONTENT_TYPES[path.extname(key).toLowerCase()] ?? "application/octet-stream",
        // Old files never change; let browsers and Cloudflare keep them for a year.
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    uploaded++;
  }
  doneBytes += size;
  const pct = ((doneBytes / totalBytes) * 100).toFixed(1).padStart(5);
  process.stdout.write(`\r${pct}%  ${(doneBytes / 1e6).toFixed(0)} / ${(totalBytes / 1e6).toFixed(0)} MB  `);
}

// A few uploads at a time.
const queue = [...files];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    for (let key = queue.shift(); key; key = queue.shift()) {
      for (let attempt = 1; ; attempt++) {
        try {
          await upload(key);
          break;
        } catch (e) {
          if (attempt === 3) {
            failed.push(`${key}: ${e.message}`);
            break;
          }
        }
      }
    }
  }),
);

console.log(`\nUploaded ${uploaded}, already there ${skipped}, failed ${failed.length}`);
if (failed.length) {
  console.log(failed.join("\n"));
  process.exitCode = 1;
}
