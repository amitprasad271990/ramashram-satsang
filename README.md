# Ramashram Satsang, Mathura (Mool Dhara) — website

The new website for ramashramsatsang.co.in. Next.js + Tailwind CSS; Supabase
(database, admin login) and Cloudflare R2 (audio, PDFs, photos) are added in
Phase 2.

## Content rule

All page text is copied **verbatim** from the old site by a script — it is never
retyped or edited by hand. Automated tests compare every page with the old HTML,
character by character, and fail if anything differs.

- `scripts/extract-content.mjs` → `src/content/legacy/*.json` (do not edit these files)
- `src/content/prakashan-transcript.ts` — the one exception: the Prakashan text
  existed only as a picture, so it was typed out word for word (the picture is
  still shown below it).

## Running it on your computer

The old site must sit next to this folder (`../www.ramashramsatsang.co.in`).

```bash
npm install
cp .env.example .env.local   # local settings (never committed)
npm run media     # prepares the photos/audio/PDFs from the old site (once)
npm run db:start  # local Supabase in Docker (Docker Desktop must be running)
npm run db:seed   # announcements, bhajan/pravachan lists, admin email (once)
npm run admin:password   # set the admin password (typed hidden, once)
npm run dev       # then open http://localhost:3000  (admin: /admin)
```

## Admin portal (`/admin`)

One admin (the email in `ADMIN_EMAIL`) logs in with email + password. New
accounts cannot sign up. The admin can:

- see, search, download (Excel/CSV) and delete **Sadasya Shapath Patra**
  forms that visitors submit on `/sadasya-shapath-patra`;
- change the announcement line shown on every page.
- **Audio** (`/admin/audio`): upload many MP3s at once into Bhajanmala, Amrit
  Vani or a pravachan shivir; edit titles; move up/down; delete.
- **Photo albums** (`/admin/albums`): create / rename / delete albums; upload
  many photos at once (resized in the browser to 2400 px); reorder; delete.

Uploads go straight from the browser to storage with a signed address that
is valid for 15 minutes:

- on this Mac (`MEDIA_STORAGE=local`) into `.uploads/` (not in git), served at
  `/local-media/…`;
- going live (`MEDIA_STORAGE=r2`) into the S3/R2 bucket. Amazon S3: also set
  `S3_REGION` (e.g. `ap-south-1`). The bucket needs a CORS rule allowing `PUT`
  from the website's address.

Visitors cannot read the submitted forms: the database allows only the admin.

## Useful commands

| Command | What it does |
|---|---|
| `npm run extract` | Re-copy the text from the old site |
| `npm run media` | Rebuild `.media/` from the old site (converts BMP pictures) |
| `npm test` | Quick unit tests |
| `npm run test:e2e` | Browser tests on a production build: same text as the old site, links, phone layout, admin portal (needs `db:start`) |
| `npm run build` | Production build |
| `npm run db:start` / `db:stop` | Start / stop the local Supabase |
| `npm run verify` | Check media files and database lists match the old site |

Media files are never committed to git.
