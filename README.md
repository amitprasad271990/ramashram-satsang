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
npm run media     # prepares the photos/audio/PDFs from the old site (once)
npm run dev       # then open http://localhost:3000
```

## Useful commands

| Command | What it does |
|---|---|
| `npm run extract` | Re-copy the text from the old site |
| `npm run media` | Rebuild `.media/` from the old site (converts BMP pictures) |
| `npm test` | Quick unit tests |
| `npm run test:e2e` | Browser tests: same text as the old site, links, phone layout |
| `npm run build` | Production build (what Vercel runs) |

Media files are never committed to git.
