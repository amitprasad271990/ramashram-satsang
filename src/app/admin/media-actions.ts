"use server";

// Admin actions for audio lists and photo albums.
// Every action checks the admin login first (and the database checks it again).

import { revalidatePath } from "next/cache";
import { deleteObject, isUploadKey, newKey, objectSize, uploadTarget } from "@/lib/storage";
import { requireAdmin } from "@/lib/supabase/session";

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const fail = (hi: string, en: string): { ok: false; error: string } => ({ ok: false, error: `${hi} / ${en}` });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cleanTitle(raw: unknown, max = 300): string | null {
  const t = String(raw ?? "").replace(/\s+/g, " ").trim();
  return t && t.length <= max ? t : null;
}

// ---------------------------------------------------------------- audio

/** Public page of an audio list. */
function collectionPage(slug: string, kind: string): string {
  if (slug === "bhajan") return "/bhajanmala";
  if (slug === "amrit-vani") return "/amrit-vani";
  return kind === "pravachan" ? `/pravachan/${slug}` : "/";
}

async function collectionOf(db: Awaited<ReturnType<typeof requireAdmin>>["db"], slug: string) {
  const { data } = await db.from("audio_collections").select("slug, kind").eq("slug", slug).maybeSingle();
  return data;
}

function refreshAudio(slug: string, kind: string) {
  revalidatePath(collectionPage(slug, kind));
  revalidatePath(`/admin/audio/${slug}`);
  revalidatePath("/admin/audio");
}

export async function startAudioUpload(collection: string, size: number): Promise<Result<{ key: string; url: string; headers: Record<string, string> }>> {
  const { db } = await requireAdmin();
  if (!(await collectionOf(db, collection))) return fail("सूची नहीं मिली", "List not found");
  try {
    const key = newKey("audio", collection);
    return { ok: true, key, ...(await uploadTarget(key, "audio", size)) };
  } catch {
    return fail("फ़ाइल बहुत बड़ी है (अधिकतम 300 MB)", "File too big (max 300 MB)");
  }
}

export async function saveTrack(input: { collection: string; key: string; title: string; duration: number | null }): Promise<Result> {
  const { db } = await requireAdmin();
  const c = await collectionOf(db, input.collection);
  const title = cleanTitle(input.title);
  if (!c || !title || !isUploadKey(input.key, "audio", input.collection)) return fail("जानकारी सही नहीं है", "Invalid details");
  const size = await objectSize(input.key);
  if (!size) return fail("फ़ाइल अपलोड नहीं हुई", "The file did not upload");

  const { data: last } = await db
    .from("audio_tracks")
    .select("sort_order")
    .eq("collection_slug", c.slug)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const duration = input.duration && Number.isFinite(input.duration) ? Math.round(input.duration) : null;
  const { error } = await db.from("audio_tracks").insert({
    collection_slug: c.slug,
    title,
    storage_key: input.key,
    sort_order: (last?.sort_order ?? 0) + 1,
    duration_seconds: duration,
    size_bytes: size,
  });
  if (error) {
    await deleteObject(input.key).catch(() => {});
    return fail("सहेजा नहीं जा सका", "Could not save");
  }
  refreshAudio(c.slug, c.kind);
  return { ok: true };
}

async function trackOf(db: Awaited<ReturnType<typeof requireAdmin>>["db"], id: string) {
  if (!UUID.test(id)) return null;
  const { data } = await db
    .from("audio_tracks")
    .select("id, collection_slug, storage_key, sort_order, audio_collections(kind)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const kind = (data.audio_collections as unknown as { kind: string } | null)?.kind ?? "";
  return { ...data, kind };
}

export async function renameTrack(id: string, rawTitle: string): Promise<Result> {
  const { db } = await requireAdmin();
  const t = await trackOf(db, id);
  const title = cleanTitle(rawTitle);
  if (!t) return fail("नहीं मिला", "Not found");
  if (!title) return fail("नाम खाली या बहुत लंबा है", "Title is empty or too long");
  const { error } = await db.from("audio_tracks").update({ title }).eq("id", id);
  if (error) return fail("सहेजा नहीं जा सका", "Could not save");
  refreshAudio(t.collection_slug, t.kind);
  return { ok: true };
}

export async function moveTrack(id: string, dir: -1 | 1): Promise<Result> {
  const { db } = await requireAdmin();
  const t = await trackOf(db, id);
  if (!t) return fail("नहीं मिला", "Not found");
  const { data: list } = await db
    .from("audio_tracks")
    .select("id, sort_order")
    .eq("collection_slug", t.collection_slug)
    .order("sort_order")
    .order("created_at");
  const rows = list ?? [];
  const i = rows.findIndex((r) => r.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= rows.length) return { ok: true };
  // Renumber the whole list 1..n with the two swapped (also repairs equal numbers).
  [rows[i], rows[j]] = [rows[j], rows[i]];
  for (const [n, r] of rows.entries()) {
    if (r.sort_order !== n + 1) await db.from("audio_tracks").update({ sort_order: n + 1 }).eq("id", r.id);
  }
  refreshAudio(t.collection_slug, t.kind);
  return { ok: true };
}

export async function deleteTrack(id: string): Promise<Result> {
  const { db } = await requireAdmin();
  const t = await trackOf(db, id);
  if (!t) return fail("नहीं मिला", "Not found");
  const { error } = await db.from("audio_tracks").delete().eq("id", id);
  if (error) return fail("हटाया नहीं जा सका", "Could not delete");
  await deleteObject(t.storage_key).catch(() => {}); // the list is what visitors see; a leftover file is harmless
  refreshAudio(t.collection_slug, t.kind);
  return { ok: true };
}

// ---------------------------------------------------------------- photos

function refreshAlbum(id?: string) {
  revalidatePath("/photo-album");
  revalidatePath("/admin/albums");
  if (id) {
    revalidatePath(`/photo-album/${id}`);
    revalidatePath(`/admin/albums/${id}`);
  }
}

export async function createAlbum(rawTitle: string): Promise<Result<{ id: string }>> {
  const { db } = await requireAdmin();
  const title = cleanTitle(rawTitle, 200);
  if (!title) return fail("एल्बम का नाम लिखें", "Please type an album name");
  const { data: first } = await db.from("photo_albums").select("sort_order").order("sort_order").limit(1).maybeSingle();
  // New albums go first in the list.
  const { data, error } = await db
    .from("photo_albums")
    .insert({ title, sort_order: (first?.sort_order ?? 1) - 1 })
    .select("id")
    .single();
  if (error || !data) return fail("एल्बम नहीं बन सका", "Could not create the album");
  refreshAlbum(data.id);
  return { ok: true, id: data.id };
}

export async function renameAlbum(id: string, rawTitle: string): Promise<Result> {
  const { db } = await requireAdmin();
  const title = cleanTitle(rawTitle, 200);
  if (!UUID.test(id)) return fail("नहीं मिला", "Not found");
  if (!title) return fail("एल्बम का नाम लिखें", "Please type an album name");
  const { error } = await db.from("photo_albums").update({ title }).eq("id", id);
  if (error) return fail("सहेजा नहीं जा सका", "Could not save");
  refreshAlbum(id);
  return { ok: true };
}

export async function deleteAlbum(id: string): Promise<Result> {
  const { db } = await requireAdmin();
  if (!UUID.test(id)) return fail("नहीं मिला", "Not found");
  const { data: photos } = await db.from("photos").select("storage_key").eq("album_id", id);
  const { error } = await db.from("photo_albums").delete().eq("id", id); // photos rows go with it
  if (error) return fail("हटाया नहीं जा सका", "Could not delete");
  for (const p of photos ?? []) await deleteObject(p.storage_key).catch(() => {});
  refreshAlbum(id);
  return { ok: true };
}

export async function startPhotoUpload(albumId: string, size: number): Promise<Result<{ key: string; url: string; headers: Record<string, string> }>> {
  const { db } = await requireAdmin();
  if (!UUID.test(albumId)) return fail("एल्बम नहीं मिला", "Album not found");
  const { data: album } = await db.from("photo_albums").select("id").eq("id", albumId).maybeSingle();
  if (!album) return fail("एल्बम नहीं मिला", "Album not found");
  try {
    const key = newKey("photo", albumId.toLowerCase());
    return { ok: true, key, ...(await uploadTarget(key, "photo", size)) };
  } catch {
    return fail("चित्र बहुत बड़ा है", "Photo too big");
  }
}

export async function savePhoto(input: { albumId: string; key: string; width: number; height: number }): Promise<Result> {
  const { db } = await requireAdmin();
  const w = Math.round(input.width);
  const h = Math.round(input.height);
  if (!UUID.test(input.albumId) || !isUploadKey(input.key, "photo", input.albumId.toLowerCase()) || !(w > 0 && h > 0 && w <= 10000 && h <= 10000)) {
    return fail("जानकारी सही नहीं है", "Invalid details");
  }
  if (!(await objectSize(input.key))) return fail("चित्र अपलोड नहीं हुआ", "The photo did not upload");
  const { data: last } = await db
    .from("photos")
    .select("sort_order")
    .eq("album_id", input.albumId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await db.from("photos").insert({
    album_id: input.albumId,
    storage_key: input.key,
    width: w,
    height: h,
    sort_order: (last?.sort_order ?? -1) + 1,
  });
  if (error) {
    await deleteObject(input.key).catch(() => {});
    return fail("सहेजा नहीं जा सका", "Could not save");
  }
  refreshAlbum(input.albumId);
  return { ok: true };
}

export async function deletePhoto(id: string): Promise<Result> {
  const { db } = await requireAdmin();
  if (!UUID.test(id)) return fail("नहीं मिला", "Not found");
  const { data: p } = await db.from("photos").select("album_id, storage_key").eq("id", id).maybeSingle();
  if (!p) return fail("नहीं मिला", "Not found");
  const { error } = await db.from("photos").delete().eq("id", id);
  if (error) return fail("हटाया नहीं जा सका", "Could not delete");
  await deleteObject(p.storage_key).catch(() => {});
  refreshAlbum(p.album_id);
  return { ok: true };
}

export async function movePhoto(id: string, dir: -1 | 1): Promise<Result> {
  const { db } = await requireAdmin();
  if (!UUID.test(id)) return fail("नहीं मिला", "Not found");
  const { data: p } = await db.from("photos").select("album_id").eq("id", id).maybeSingle();
  if (!p) return fail("नहीं मिला", "Not found");
  const { data: list } = await db.from("photos").select("id, sort_order").eq("album_id", p.album_id).order("sort_order").order("created_at");
  const rows = list ?? [];
  const i = rows.findIndex((r) => r.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= rows.length) return { ok: true };
  [rows[i], rows[j]] = [rows[j], rows[i]];
  for (const [n, r] of rows.entries()) {
    if (r.sort_order !== n) await db.from("photos").update({ sort_order: n }).eq("id", r.id);
  }
  refreshAlbum(p.album_id);
  return { ok: true };
}
