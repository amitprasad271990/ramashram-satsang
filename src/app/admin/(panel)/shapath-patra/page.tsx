import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/session";
import { inputClass, istDate, primaryButton, secondaryButton } from "../../ui";
import { DeleteButton } from "./DeleteButton";

export const metadata: Metadata = { title: "शपथ पत्र / Pledges" };

const PAGE_SIZE = 50;

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

/** Characters that would break the database search filter. */
const cleanQuery = (q: string) => q.replace(/[,()%*\\]/g, " ").trim().slice(0, 100);

export default async function PledgesPage({ searchParams }: Props) {
  const { db } = await requireAdmin();
  const sp = await searchParams;
  const q = cleanQuery(sp.q ?? "");
  const page = Math.max(1, Number(sp.page) || 1);

  let query = db
    .from("pledges")
    .select("id, name, address, phone, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,address.ilike.%${q}%`);
  const { data: rows, count, error } = await query;
  if (error) throw error;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const link = (p: number) => `/admin/shapath-patra?${new URLSearchParams({ ...(q && { q }), page: String(p) })}`;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-maroon">
          सदस्य-शपथ पत्र <span className="block text-lg text-ink-soft">Pledges ({count ?? 0})</span>
        </h1>
        <a href={`/admin/shapath-patra/export${q ? `?q=${encodeURIComponent(q)}` : ""}`} className={secondaryButton}>
          ⬇ Excel में डाउनलोड / Download for Excel
        </a>
      </div>

      <form className="mt-6 flex gap-2" role="search">
        <label className="flex-1">
          <span className="sr-only">खोजें / Search</span>
          <input name="q" defaultValue={q} placeholder="नाम, फ़ोन या पता खोजें / Search name, phone or address" className={`${inputClass} mt-0`} />
        </label>
        <button className={primaryButton}>खोजें</button>
      </form>
      {q && (
        <p className="mt-2 text-sm">
          “{q}” के परिणाम / Results for “{q}” ·{" "}
          <Link href="/admin/shapath-patra" className="text-maroon underline">
            सब दिखाएँ / Show all
          </Link>
        </p>
      )}

      {rows.length === 0 ? (
        <p className="mt-10 rounded-3xl bg-white p-8 text-center text-ink-soft shadow-[var(--shadow-card)]">
          {q ? "कुछ नहीं मिला / Nothing found" : "अभी तक कोई शपथ पत्र नहीं आया / No pledges yet"}
        </p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-sand bg-white p-4 shadow-[0_1px_2px_rgb(79_17_25/0.05)] sm:p-5">
              <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold text-maroon-deep">{r.name}</p>
                  <a href={`tel:${r.phone}`} className="text-maroon tabular-nums underline underline-offset-4">
                    {r.phone}
                  </a>
                  {r.address && <p className="mt-1 whitespace-pre-line text-ink-soft">{r.address}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <time className="text-sm text-ink-soft" dateTime={r.created_at}>
                    {istDate.format(new Date(r.created_at))}
                  </time>
                  <DeleteButton id={r.id} name={r.name} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-3">
          {page > 1 && <Link href={link(page - 1)} className={secondaryButton}>‹ पिछला / Previous</Link>}
          <span className="tabular-nums">{page} / {pages}</span>
          {page < pages && <Link href={link(page + 1)} className={secondaryButton}>अगला / Next ›</Link>}
        </nav>
      )}
    </>
  );
}
