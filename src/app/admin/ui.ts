// Shared styles for the admin screens (large, simple controls).
export const inputClass =
  "mt-1.5 block w-full rounded-2xl border-2 border-sand bg-ivory px-4 py-3 text-base text-ink outline-none transition focus:border-saffron focus:bg-white";
export const primaryButton =
  "rounded-full bg-maroon px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-maroon-deep disabled:opacity-60";
export const secondaryButton =
  "rounded-full border-2 border-maroon/30 bg-white px-5 py-2.5 font-semibold text-maroon transition hover:bg-saffron-soft";

export const istDate = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
