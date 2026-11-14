// Checking a Shapath Patra form submission (shared by the server action and tests).

export type PledgeInput = { name: string; address: string; phone: string };
export type PledgeErrors = Partial<Record<keyof PledgeInput, string>>;

export const PLEDGE_MESSAGES = {
  nameRequired: "कृपया अपना नाम लिखें।",
  nameTooLong: "नाम बहुत लंबा है।",
  addressTooLong: "पता बहुत लंबा है।",
  phoneInvalid: "कृपया सही फ़ोन नंबर लिखें (कम से कम 10 अंक)।",
  tooMany: "आपने अभी-अभी शपथ पत्र भेजा है। कृपया कुछ देर बाद फिर से प्रयास करें।",
  failed: "क्षमा करें, अभी जमा नहीं हो सका। कृपया फिर से प्रयास करें।",
  success: "धन्यवाद! आपका शपथ पत्र प्राप्त हो गया है। गुरुदेव आप पर कृपा करें।",
} as const;

/** Trim and check the three fields; returns cleaned values or the problems found. */
export function validatePledge(raw: PledgeInput): { ok: true; value: PledgeInput } | { ok: false; errors: PledgeErrors } {
  const name = raw.name.replace(/\s+/g, " ").trim();
  const address = raw.address.replace(/[ \t]+/g, " ").trim();
  // Keep digits and a leading +; allow people to type spaces or dashes.
  const phone = raw.phone.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  const digits = phone.replace(/\D/g, "");

  const errors: PledgeErrors = {};
  if (!name) errors.name = PLEDGE_MESSAGES.nameRequired;
  else if (name.length > 200) errors.name = PLEDGE_MESSAGES.nameTooLong;
  if (address.length > 1000) errors.address = PLEDGE_MESSAGES.addressTooLong;
  if (digits.length < 10 || digits.length > 15) errors.phone = PLEDGE_MESSAGES.phoneInvalid;

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { name, address, phone } };
}
