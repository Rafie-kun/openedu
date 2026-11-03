import { describe, expect, it } from "vitest";
import { formatMoney, safeInternalPath } from "../src/format";
import { profileCompleteness } from "../src/profile";

describe("safeInternalPath", () => {
  it("keeps a normal internal path", () => {
    expect(safeInternalPath("/universities/eth-zurich")).toBe("/universities/eth-zurich");
  });

  it("rejects absolute and protocol-relative urls", () => {
    expect(safeInternalPath("https://evil.example")).toBe("/dashboard");
    expect(safeInternalPath("//evil.example")).toBe("/dashboard");
    expect(safeInternalPath("/\\evil.example")).toBe("/dashboard");
  });

  it("falls back when empty", () => {
    expect(safeInternalPath(null)).toBe("/dashboard");
    expect(safeInternalPath(undefined, "/saved")).toBe("/saved");
  });
});

describe("formatMoney", () => {
  it("formats a known currency", () => {
    expect(formatMoney(1200, "EUR")).toContain("1,200");
  });

  it("does not invent a value", () => {
    expect(formatMoney(null, "USD")).toBe("Not specified");
    expect(formatMoney("abc", "USD")).toBe("Not specified");
  });

  it("falls back when the currency code is malformed", () => {
    expect(formatMoney(10, "US")).toBe("10.00 US");
  });
});

describe("profileCompleteness", () => {
  const empty = {
    nationalityCountryId: null,
    countryOfResidenceId: null,
    intendedDegreeLevel: null,
    intendedSubjectId: null,
    preferredDestinationCount: 0,
    qualificationCount: 0,
    languageQualificationCount: 0,
  };

  it("reports every gap for a new profile", () => {
    const result = profileCompleteness(empty);
    expect(result.percent).toBe(0);
    expect(result.gaps).toHaveLength(7);
  });

  it("counts a partial profile without pretending it is done", () => {
    const result = profileCompleteness({
      ...empty,
      nationalityCountryId: "c_bd",
      qualificationCount: 2,
    });
    expect(result.completed).toBe(2);
    expect(result.percent).toBe(29);
    expect(result.gaps.map((gap) => gap.key)).toContain("language");
  });

  it("reaches 100 only when everything is present", () => {
    const result = profileCompleteness({
      nationalityCountryId: "c_bd",
      countryOfResidenceId: "c_bd",
      intendedDegreeLevel: "UNDERGRADUATE",
      intendedSubjectId: "s_cs",
      preferredDestinationCount: 1,
      qualificationCount: 1,
      languageQualificationCount: 1,
    });
    expect(result.percent).toBe(100);
    expect(result.gaps).toHaveLength(0);
  });
});
