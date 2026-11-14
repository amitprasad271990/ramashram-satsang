"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deletePledge } from "../../actions";

export function DeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`"${name}" का शपथ पत्र हटाएँ?\nDelete this pledge? This cannot be undone.`)) return;
        start(async () => {
          try {
            await deletePledge(id);
          } catch {
            alert("हटाया नहीं जा सका, फिर से कोशिश करें / Could not delete, please try again");
          }
          router.refresh(); // show the updated list
        });
      }}
      className="rounded-full border-2 border-maroon/20 px-3 py-1.5 text-sm font-semibold text-maroon hover:bg-maroon hover:text-white disabled:opacity-50"
    >
      {pending ? "…" : "हटाएँ / Delete"}
    </button>
  );
}
