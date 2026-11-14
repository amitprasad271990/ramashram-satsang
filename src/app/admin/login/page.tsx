import type { Metadata } from "next";
import { LotusMark } from "@/components/Ornaments";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Login" };

type Props = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-3xl border border-sand bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
        <LotusMark className="mx-auto h-14 w-14 text-maroon" />
        <h1 className="mt-3 text-center font-[family-name:var(--font-display)] text-2xl text-maroon">
          एडमिन लॉगिन
          <span className="block text-base text-ink-soft">Admin login</span>
        </h1>
        {error === "not-admin" && (
          <p role="alert" className="mt-5 rounded-2xl bg-maroon/10 px-4 py-3 font-semibold text-maroon">
            इस खाते को एडमिन अनुमति नहीं है / This account is not an admin
          </p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
