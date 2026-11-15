"use client";

import { useActionState } from "react";
import { saveAnnouncement, type FormState } from "../../actions";
import { inputClass, primaryButton } from "../../ui";

/** Save, turning a lost connection or server crash into a clear message (instead of nothing). */
async function save(prev: FormState, form: FormData): Promise<FormState> {
  try {
    return (await saveAnnouncement(prev, form)) ?? {};
  } catch {
    return {
      error:
        "सहेजा नहीं जा सका — इंटरनेट कनेक्शन जाँचें और फिर से कोशिश करें / Could not save — check the internet connection and try again",
    };
  }
}

export function AnnouncementForm({ initial }: { initial: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(save, {});
  return (
    <form action={action} className="mt-6 grid gap-4 rounded-3xl bg-white p-5 shadow-[var(--shadow-card)] sm:p-8">
      <label className="block">
        <span className="font-semibold">नई सूचना / New announcement</span>
        <textarea name="text" defaultValue={initial} rows={5} maxLength={1000} required className={`${inputClass} leading-relaxed`} />
      </label>
      {state.error && <p role="alert" className="rounded-2xl border-2 border-maroon bg-maroon/10 px-4 py-3 font-semibold text-maroon">⚠ {state.error}</p>}
      {state.ok && <p role="status" className="rounded-2xl bg-[#e7f4e4] px-4 py-3 font-semibold text-[#24602a]">✓ {state.ok}</p>}
      <div>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "…" : "सहेजें / Save"}
        </button>
      </div>
    </form>
  );
}
