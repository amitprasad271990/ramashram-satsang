// One-time import into the database: the admin's email address, and the old
// site's audio lists and announcements. Existing rows are never overwritten,
// so anything the admin has changed later is safe if this is run again.
// (The tables themselves come from supabase/migrations, applied by the Supabase CLI.)
//
// Usage: npm run db:seed      (reads DATABASE_URL and ADMIN_EMAIL from .env.local)

import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { parseFile } from "music-metadata";
import sharp from "sharp";
import { dbSsl } from "./r2.mjs";

const legacy = (f) => JSON.parse(fs.readFileSync(path.resolve("src/content/legacy", f), "utf8"));
const audio = legacy("audio.json");
const site = legacy("site.json");
const MEDIA = path.resolve(".media");

const collections = [
  { slug: "bhajan", kind: "bhajan", ...audio.pages.bhajan, tracks: audio.tracks.bhajan },
  { slug: "amrit-vani", kind: "amrit_vani", heading: site.amritVaniPage.heading, intro: null, tracks: audio.tracks.amritVani },
  ...["kolkata-2016", "kolkata-2013", "aurangabad-2013", "lonavala-2014"].map((slug) => ({
    slug,
    kind: "pravachan",
    ...audio.pages[slug],
    tracks: audio.tracks.pravachan[slug],
  })),
];

// Starting photo album: the photographs that were already on the old site
// (portraits and photo cards; decorations and duplicates left out).
const STARTING_ALBUM = "सत्संग चित्र संग्रह";
const STARTING_PHOTOS = [
  "Images/top1.jpg",
  "Images/left2new.jpg",
  "Images/right.jpg",
  "Images/Guruji_5x7.jpg",
  "Images/Babuji.jpg",
  "Images/lights1.jpg",
  "Images/lights2.jpg",
  "Images/lights3.jpg",
  "Images/lights4.jpg",
  "Images/lights9.jpg",
  "Images/35.jpg",
];

async function fileInfo(key) {
  const file = path.join(MEDIA, key);
  if (!fs.existsSync(file)) return { duration: null, size: null };
  const size = fs.statSync(file).size;
  try {
    const { format } = await parseFile(file, { duration: true });
    return { duration: format.duration ? Math.round(format.duration) : null, size };
  } catch {
    return { duration: null, size };
  }
}

if (!process.env.ADMIN_EMAIL) throw new Error("ADMIN_EMAIL is missing from .env.local");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: dbSsl() });
await client.connect();
try {
  await client.query("begin");

  await client.query("insert into public.admins (email) values ($1) on conflict do nothing", [process.env.ADMIN_EMAIL.trim()]);
  console.log(`✓ admin: ${process.env.ADMIN_EMAIL}`);

  for (const [key, text] of Object.entries(site.announcements)) {
    await client.query("insert into public.announcements (key, text) values ($1, $2) on conflict do nothing", [key, text]);
  }
  console.log(`✓ ${Object.keys(site.announcements).length} announcements`);

  for (const [i, c] of collections.entries()) {
    await client.query(
      `insert into public.audio_collections (slug, kind, heading, intro, sort_order)
       values ($1, $2, $3, $4, $5) on conflict do nothing`,
      [c.slug, c.kind, c.heading, c.intro, i],
    );
    let added = 0;
    for (const t of c.tracks) {
      const { duration, size } = await fileInfo(t.file);
      const r = await client.query(
        `insert into public.audio_tracks (collection_slug, title, storage_key, sort_order, duration_seconds, size_bytes)
         values ($1, $2, $3, $4, $5, $6) on conflict (storage_key) do nothing`,
        [c.slug, t.title, t.file, t.order, duration, size],
      );
      added += r.rowCount;
    }
    console.log(`✓ ${c.slug}: ${added} new of ${c.tracks.length} tracks`);
  }

  // Photo album (created once; later changes by the admin are kept).
  let album = (await client.query("select id from public.photo_albums where title = $1", [STARTING_ALBUM])).rows[0];
  if (!album) {
    album = (await client.query("insert into public.photo_albums (title, sort_order) values ($1, 0) returning id", [STARTING_ALBUM])).rows[0];
    let added = 0;
    for (const [i, key] of STARTING_PHOTOS.entries()) {
      const { width, height } = await sharp(path.join(MEDIA, key)).metadata();
      const r = await client.query(
        `insert into public.photos (album_id, storage_key, width, height, sort_order)
         values ($1, $2, $3, $4, $5) on conflict (storage_key) do nothing`,
        [album.id, key, width, height, i],
      );
      added += r.rowCount;
    }
    console.log(`✓ album "${STARTING_ALBUM}": ${added} photos`);
  } else {
    console.log(`✓ album "${STARTING_ALBUM}" already exists (left unchanged)`);
  }

  await client.query("commit");
} catch (e) {
  await client.query("rollback");
  throw e;
} finally {
  await client.end();
}
