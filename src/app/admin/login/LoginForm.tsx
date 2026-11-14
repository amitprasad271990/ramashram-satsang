"use client";

import { useActionState } from "react";
import { signIn, type FormState } from "../actions";
import { inputClass, primaryButton } from "../ui";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});
  return (
    <form action={action} className="mt-6 grid gap-4">
      <label className="block">
        <span className="font-semibold">ईमेल / Email</span>
        <input name="email" type="email" autoComplete="username" required className={inputClass} />
      </label>
      <label className="block">
        <span className="font-semibold">पासवर्ड / Password</span>
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </label>
      {state.error && (
        <p role="alert" className="rounded-2xl bg-maroon/10 px-4 py-3 font-semibold text-maroon">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "…" : "लॉगिन करें / Log in"}
      </button>
    </form>
  );
}
