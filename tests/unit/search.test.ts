import { describe, expect, it } from "vitest";
import { matches } from "@/lib/search";

describe("bhajan search", () => {
  const title = "1.गुरु वंदना : हे दीनबंधु दयालु गुरु ...";

  it("finds words in any order, ignoring spaces and punctuation", () => {
    expect(matches(title, "वंदना")).toBe(true);
    expect(matches(title, "दयालु गुरु")).toBe(true);
    expect(matches(title, "दीन बंधु")).toBe(true);
    expect(matches(title, "गुरु वंदना:")).toBe(true);
  });

  it("ignores nukta and chandrabindu differences", () => {
    expect(matches("फ़ोन-न०", "फोन")).toBe(true);
    expect(matches("माँ की कृपा", "मां")).toBe(true);
  });

  it("finds numbers and English titles", () => {
    expect(matches("01 Jaipur(23-08-2013 2107)", "jaipur")).toBe(true);
    expect(matches("01 Jaipur(23-08-2013 2107)", "2013")).toBe(true);
  });

  it("does not match missing words; empty query matches all", () => {
    expect(matches(title, "आरती")).toBe(false);
    expect(matches(title, "   ")).toBe(true);
  });
});
