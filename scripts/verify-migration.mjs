// Checks that the migration is complete:
//  - (R2 mode) every prepared media file is in R2 with the right size
//  - every old playlist entry is in the database with the exact title and order
//  - every track can be fetched from the public media address (with seeking support)
// Usage: npm run verify

import fs from "node:fs";
import path from "node:path";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import pg from "pg";
import { dbSsl, MEDIA_STORAGE, r2 } from "./r2.mjs";

let problems = 0;
const fail = (msg) => {
  problems++;
  console.log(`✗ ${msg}`);
};

// 1. R2 contents (local mode serves .media directly, checked in step 3)
const MEDIA = path.resolve(".media");
const local = fs.readdirSync(MEDIA, { recursive: true }).map((f) => f.split(path.sep).join("/"))
  .filter((f) => fs.statSync(path.join(MEDIA, f)).isFile());
if (MEDIA_STORAGE === "r2") {
  const { client, bucket } = r2();
  const remote = new Map();
  let token;
  do {
    const page = await client.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
    for (const o of page.Contents ?? []) remote.set(o.Key, o.Size);
    token = page.NextContinuationToken;
  } while (token);
  for (const f of local) {
    const size = fs.statSync(path.join(MEDIA, f)).size;
    if (remote.get(f) !== size) fail(`R2: ${f} missing or wrong size`);
  }
  console.log(`R2: ${remote.size} files in bucket, ${local.length} expected`);
} else {
  console.log(`Local media: ${local.length} files in .media`);
}

// 2. Database rows vs the old playlists
const audio = JSON.parse(fs.readFileSync("src/content/legacy/audio.json", "utf8"));
const expected = [
  ["bhajan", audio.tracks.bhajan],
  ["amrit-vani", audio.tracks.amritVani],
  ...Object.entries(audio.tracks.pravachan),
];
const db = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: dbSsl() });
await db.connect();
const { rows } = await db.query("select collection_slug, title, storage_key, sort_order from public.audio_tracks");
await db.end();
for (const [slug, tracks] of expected) {
  for (const t of tracks) {
    const row = rows.find((r) => r.storage_key === t.file);
    if (!row) fail(`DB: ${t.file} missing`);
    else if (row.collection_slug !== slug || row.title !== t.title || row.sort_order !== t.order)
      fail(`DB: ${t.file} differs (${row.collection_slug} #${row.sort_order} "${row.title}")`);
  }
}
console.log(`DB: ${rows.length} tracks, ${expected.reduce((n, [, t]) => n + t.length, 0)} expected`);

// 3. Public address works, with byte ranges (needed to skip forward in long pravachans)
// Local mode: the site (npm run dev) serves .media at /legacy.
const base = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || (MEDIA_STORAGE === "r2" ? "" : "http://localhost:3000/legacy")).replace(/\/$/, "");
if (!base) fail("NEXT_PUBLIC_MEDIA_BASE_URL is missing");
else {
  for (const key of rows.map((r) => r.storage_key)) {
    const url = `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
    const res = await fetch(url, { headers: { Range: "bytes=0-1" } });
    if (res.status !== 206) fail(`Public: ${key} → HTTP ${res.status}`);
    await res.body?.cancel();
  }
  console.log(`Public: checked ${rows.length} tracks at ${base}`);
}

console.log(problems ? `\n${problems} problem(s) found` : "\nAll good ✓");
process.exitCode = problems ? 1 : 0;
