import { describe, expect, it } from "vitest";
import { draftFromPayload, slugify, uniqueSlug } from "./candidates";

describe("draftFromPayload", () => {
  it("reads the ROR field names", () => {
    const draft = draftFromPayload({
      displayName: "University of Oxford",
      city: "Oxford",
      countryCode: "gb",
      website: "https://www.ox.ac.uk",
    });
    expect(draft).toEqual({
      name: "University of Oxford",
      city: "Oxford",
      countryCode: "GB",
      websiteUrl: "https://www.ox.ac.uk",
    });
  });

  it("falls back to name when displayName is absent", () => {
    expect(draftFromPayload({ name: "ETH Zurich" }).name).toBe("ETH Zurich");
  });

  it("returns empty fields for a missing payload", () => {
    expect(draftFromPayload(null)).toEqual({ name: "", city: "", countryCode: "", websiteUrl: "" });
  });
});

describe("slugify", () => {
  it("lowercases and joins words with dashes", () => {
    expect(slugify("University of Oxford")).toBe("university-of-oxford");
  });

  it("strips accents instead of dropping the letter", () => {
    expect(slugify("Université de Montréal")).toBe("universite-de-montreal");
  });

  it("turns ampersands into 'and'", () => {
    expect(slugify("Science & Technology")).toBe("science-and-technology");
  });

  it("removes leading and trailing dashes", () => {
    expect(slugify("  -- ETH Zurich -- ")).toBe("eth-zurich");
  });
});

describe("uniqueSlug", () => {
  it("keeps the base when it is free", () => {
    expect(uniqueSlug("eth-zurich", ["university-of-oxford"])).toBe("eth-zurich");
  });

  it("adds a counter when the slug is taken", () => {
    expect(uniqueSlug("eth-zurich", ["eth-zurich"])).toBe("eth-zurich-2");
    expect(uniqueSlug("eth-zurich", ["eth-zurich", "eth-zurich-2"])).toBe("eth-zurich-3");
  });

  it("falls back to a generic root for an empty base", () => {
    expect(uniqueSlug("", [])).toBe("institution");
  });
});
