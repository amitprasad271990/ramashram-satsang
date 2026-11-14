// Builds the media folder (.media/, git-ignored) from the old site:
// unchanged files are linked, and formats browsers cannot show are converted.
// In development public/legacy points here; Phase 2 uploads this folder to R2.
//
// Usage: node scripts/prepare-media.mjs [path-to-old-site]

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import ffmpeg from "ffmpeg-static";

const OLD = path.resolve(process.argv[2] ?? "../www.ramashramsatsang.co.in");
const OUT = path.resolve(".media");
const MEDIA = /\.(mp3|pdf|jpe?g|png|gif|bmp|ico)$/i;

const head = (file, n) => {
  const fd = fs.openSync(file, "r");
  const b = Buffer.alloc(n);
  fs.readSync(fd, b, 0, n, 0);
  fs.closeSync(fd);
  return b.toString("latin1");
};
/** Files whose contents are BMP regardless of extension → converted to PNG. */
const isBmp = (file) => head(file, 2) === "BM";
/** Phone recordings (AMR) saved with an .mp3 name; most browsers cannot play them. */
const isAmr = (file) => head(file, 5) === "#!AMR";

/** Decode an uncompressed 24/32-bit BMP (sharp cannot read BMP). */
function readBmp(file) {
  const b = fs.readFileSync(file);
  const offset = b.readUInt32LE(10);
  const width = b.readInt32LE(18);
  const rawHeight = b.readInt32LE(22);
  const height = Math.abs(rawHeight);
  const bpp = b.readUInt16LE(28);
  if (b.readUInt32LE(30) !== 0 || (bpp !== 24 && bpp !== 32)) throw new Error(`Unsupported BMP: ${file}`);
  const bytes = bpp / 8;
  const stride = Math.ceil((width * bytes) / 4) * 4;
  const rgb = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    const row = rawHeight > 0 ? height - 1 - y : y; // bottom-up unless height is negative
    for (let x = 0; x < width; x++) {
      const i = offset + row * stride + x * bytes;
      const o = (y * width + x) * 3;
      rgb[o] = b[i + 2];
      rgb[o + 1] = b[i + 1];
      rgb[o + 2] = b[i];
    }
  }
  return sharp(rgb, { raw: { width, height, channels: 3 } });
}

fs.rmSync(OUT, { recursive: true, force: true });
let linked = 0;
const converted = [];
for (const rel of fs.readdirSync(OLD, { recursive: true })) {
  const src = path.join(OLD, rel);
  if (!MEDIA.test(rel) || !fs.statSync(src).isFile()) continue;
  const dest = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (/\.(bmp|png)$/i.test(rel) && isBmp(src)) {
    const png = dest.replace(/\.(bmp|png)$/i, ".png");
    await readBmp(src).png({ compressionLevel: 9 }).toFile(png);
    converted.push(`${rel} → ${path.relative(OUT, png)}`);
  } else if (/\.mp3$/i.test(rel) && isAmr(src)) {
    // Same recording, re-encoded as a real MP3 (mono speech, 64 kbps).
    execFileSync(ffmpeg, ["-v", "error", "-i", src, "-ac", "1", "-b:a", "64k", dest]);
    converted.push(`${rel} (AMR) → ${rel} (MP3)`);
  } else {
    fs.symlinkSync(src, dest);
    linked++;
  }
}
console.log(`Linked ${linked} files; converted ${converted.length}:\n  ${converted.join("\n  ")}`);
