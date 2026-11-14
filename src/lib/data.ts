// Data that the admin can change, read from Supabase.
// Pages are pre-built; admin changes refresh them (Phase 5).

import { cache } from "react";
import { pages, type PageSlug } from "@/content";
import { publicDb } from "./supabase/public";

export type AudioTrack = {
  id: string;
  title: string;
  storage_key: string;
  sort_order: number;
  duration_seconds: number | null;
};

export type AudioCollection = {
  slug: string;
  kind: "bhajan" | "pravachan" | "amrit_vani";
  heading: string;
  intro: string | null;
  tracks: AudioTrack[];
};

const allAnnouncements = cache(async () => {
  const { data, error } = await publicDb().from("announcements").select("key, text");
  if (error) throw error;
  return new Map(data.map((a) => [a.key as string, a.text as string]));
});

/** The shivir announcement line shown on a page (the one the old page showed). */
export async function getAnnouncementFor(slug: PageSlug): Promise<string | null> {
  const key = pages[slug].announcement;
  if (!key) return null;
  return (await allAnnouncements()).get(key) ?? null;
}

/** An audio collection with its tracks in playlist order. */
export const getCollection = cache(async (slug: string): Promise<AudioCollection | null> => {
  const { data, error } = await publicDb()
    .from("audio_collections")
    .select("slug, kind, heading, intro, tracks:audio_tracks(id, title, storage_key, sort_order, duration_seconds)")
    .eq("slug", slug)
    .order("sort_order", { referencedTable: "audio_tracks", ascending: true })
    .maybeSingle();
  if (error) throw error;
  return data as AudioCollection | null;
});
