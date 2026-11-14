import { requireAdmin } from "@/lib/supabase/session";

/** All pledges (or the current search) as a CSV file that opens in Excel with Hindi intact. */
export async function GET(request: Request) {
  const { db } = await requireAdmin();
  const q = (new URL(request.url).searchParams.get("q") ?? "").replace(/[,()%*\\]/g, " ").trim().slice(0, 100);

  const rows: { name: string; address: string | null; phone: string; created_at: string }[] = [];
  for (let from = 0; ; from += 1000) {
    let query = db.from("pledges").select("name, address, phone, created_at").order("created_at").range(from, from + 999);
    if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,address.ilike.%${q}%`);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }

  const ist = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "short" });
  const cell = (v: string) => {
    const s = /^[=+\-@]/.test(v) ? `'${v}` : v; // stop Excel treating text as a formula
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [
    ["क्रम / No.", "नाम / Name", "पता / Address", "फ़ोन / Phone", "दिनांक / Date"].map(cell).join(","),
    ...rows.map((r, i) => [String(i + 1), r.name, r.address ?? "", r.phone, ist.format(new Date(r.created_at))].map(cell).join(",")),
  ];
  const date = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="shapath-patra-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
