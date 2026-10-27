// Records the pixel size of every image in the old site, so pages can reserve
// space for images before they load (no layout jumps).
// Usage: node scripts/image-sizes.mjs [path-to-old-site]

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OLD = path.resolve(process.argv[2] ?? "../www.ramashramsatsang.co.in");
const OUT = path.resolve("src/content/legacy/image-sizes.json");

const files = fs
  .readdirSync(OLD, { recursive: true })
  .filter((f) => /\.(jpe?g|png|gif|bmp)$/i.test(f));

const sizes = {};
for (const f of files.sort()) {
  try {
    const { width, height } = await sharp(path.join(OLD, f)).metadata();
    sizes[f.split(path.sep).join("/")] = { width, height };
  } catch {
    // sharp cannot read BMP (some .png files here are really BMPs); read the header directly.
    const b = fs.readFileSync(path.join(OLD, f));
    if (b.toString("ascii", 0, 2) === "BM") {
      sizes[f.split(path.sep).join("/")] = { width: b.readInt32LE(18), height: Math.abs(b.readInt32LE(22)) };
    } else throw new Error(`Cannot read ${f}`);
  }
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(sizes, null, 2) + "\n");
console.log(`Recorded ${Object.keys(sizes).length} image sizes`);
