import { describe, expect, it } from "vitest";
import { convertAmount, parseRatesPayload } from "./exchange-rates";

describe("parseRatesPayload", () => {
  it("reads the date and numeric rates", () => {
    const parsed = parseRatesPayload(
      { base: "EUR", date: "2026-11-05", rates: { USD: 1.09, GBP: 0.86 } },
      "EUR",
    );

    expect(parsed).toEqual({ date: "2026-11-05", rates: { USD: 1.09, GBP: 0.86 } });
  });

  it("rejects a payload for a different base", () => {
    expect(parseRatesPayload({ base: "USD", date: "2026-11-05", rates: { EUR: 0.9 } }, "EUR")).toBe(
      null,
    );
  });

  it("drops values that are not positive numbers", () => {
    const parsed = parseRatesPayload(
      { base: "EUR", date: "2026-11-05", rates: { USD: 1.09, GBP: "0.86", JPY: -1 } },
      "EUR",
    );

    expect(parsed?.rates).toEqual({ USD: 1.09 });
  });

  it("rejects an empty rate set", () => {
    expect(parseRatesPayload({ base: "EUR", date: "2026-11-05", rates: {} }, "EUR")).toBe(null);
  });
});

describe("convertAmount", () => {
  const snapshot = { base: "EUR", rates: { USD: 1.1, GBP: 0.85 } };

  it("returns the same amount for the same currency", () => {
    expect(convertAmount(10, "EUR", "EUR", snapshot)).toBe(10);
  });

  it("divides by the quote-per-base rate", () => {
    expect(convertAmount(110, "USD", "EUR", snapshot)).toBeCloseTo(100);
    expect(convertAmount(85, "GBP", "EUR", snapshot)).toBeCloseTo(100);
  });

  it("returns null when the currency is missing", () => {
    expect(convertAmount(10, "JPY", "EUR", snapshot)).toBe(null);
  });

  it("returns null when the snapshot base is not the target", () => {
    expect(convertAmount(10, "USD", "GBP", snapshot)).toBe(null);
  });
});
