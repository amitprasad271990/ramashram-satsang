"use client";

import { useActionState } from "react";
import { submitPledge, type PledgeState } from "./actions";

const field =
  "mt-2 block w-full rounded-2xl border-2 border-sand bg-ivory px-4 py-3 text-lg text-ink transition outline-none focus:border-saffron focus:bg-white aria-[invalid=true]:border-maroon";

/**
 * The old site's pledge form (नाम / पता / फ़ोन-न०), now saved online.
 * `labels` are the three labels exactly as written on the old page.
 */
export function PledgeForm({ labels }: { labels: [string, string, string] }) {
  const [state, action, pending] = useActionState<PledgeState, FormData>(submitPledge, { status: "idle" });

  if (state.status === "success") {
    return (
      <div data-ui role="status" className="mt-8 rounded-3xl border-2 border-gold bg-saffron-soft/60 px-6 py-8 text-center">
        <p className="font-[family-name:var(--font-display)] text-2xl text-maroon">🙏</p>
        <p className="mt-2 text-lg font-semibold text-maroon-deep">{state.message}</p>
      </div>
    );
  }

  const [nameLabel, addressLabel, phoneLabel] = labels;
  const err = state.errors ?? {};
  return (
    <form action={action} className="mt-8 grid gap-5 rounded-3xl bg-cream/70 p-5 sm:p-8" noValidate>
      <label className="block">
        <span className="font-semibold text-maroon-deep">{nameLabel}</span>
        <input name="name" autoComplete="name" required maxLength={200} aria-invalid={!!err.name} className={field} />
        {err.name && <ErrorText>{err.name}</ErrorText>}
      </label>
      <label className="block">
        <span className="font-semibold text-maroon-deep">{addressLabel}</span>
        <textarea name="address" autoComplete="street-address" rows={3} maxLength={1000} aria-invalid={!!err.address} className={field} />
        {err.address && <ErrorText>{err.address}</ErrorText>}
      </label>
      <label className="block">
        <span className="font-semibold text-maroon-deep">{phoneLabel}</span>
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          maxLength={20}
          aria-invalid={!!err.phone}
          className={`${field} tabular-nums sm:max-w-xs`}
        />
        {err.phone && <ErrorText>{err.phone}</ErrorText>}
      </label>

      {/* Spam trap: hidden from people */}
      <div aria-hidden data-ui className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.message && (
        <p data-ui role="alert" className="rounded-2xl bg-maroon/10 px-4 py-3 font-semibold text-maroon">
          {state.message}
        </p>
      )}

      <div data-ui>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-maroon px-10 py-3.5 text-lg font-semibold text-white shadow-md transition hover:bg-maroon-deep disabled:opacity-60 sm:w-auto"
        >
          {pending ? "…" : "OK"}
        </button>
      </div>
    </form>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <span data-ui role="alert" className="mt-1.5 block font-semibold text-maroon">
      {children}
    </span>
  );
}
