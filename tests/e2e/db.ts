// Read-only database access for tests, the same way a visitor's browser reads it.

/** The announcement lines in the database right now, by key. */
export async function currentAnnouncements(): Promise<Record<string, string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase settings missing for tests");
  const r = await fetch(`${url}/rest/v1/announcements?select=key,text`, { headers: { apikey: key } });
  if (!r.ok) throw new Error(`announcements: HTTP ${r.status}`);
  const rows = (await r.json()) as { key: string; text: string }[];
  return Object.fromEntries(rows.map((a) => [a.key, a.text]));
}
