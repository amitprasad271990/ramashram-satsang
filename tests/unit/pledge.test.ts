import { describe, expect, it } from "vitest";
import { PLEDGE_MESSAGES, validatePledge } from "@/lib/pledge";

describe("validatePledge", () => {
  it("accepts a normal Indian mobile number typed with spaces", () => {
    const r = validatePledge({ name: "  राम  कुमार ", address: "मथुरा", phone: "98765 43210" });
    expect(r).toEqual({ ok: true, value: { name: "राम कुमार", address: "मथुरा", phone: "9876543210" } });
  });
  it("keeps a leading + for international numbers", () => {
    const r = validatePledge({ name: "A", address: "", phone: "+91-98765-43210" });
    expect(r.ok && r.value.phone).toBe("+919876543210");
  });
  it("requires a name and a real phone number", () => {
    const r = validatePledge({ name: " ", address: "", phone: "123" });
    expect(r).toEqual({ ok: false, errors: { name: PLEDGE_MESSAGES.nameRequired, phone: PLEDGE_MESSAGES.phoneInvalid } });
  });
  it("address is optional but limited in length", () => {
    expect(validatePledge({ name: "A", address: "", phone: "9876543210" }).ok).toBe(true);
    expect(validatePledge({ name: "A", address: "x".repeat(1001), phone: "9876543210" }).ok).toBe(false);
  });
});
