import { describe, expect, it } from "vitest";
import {
  languageTestSchema,
  loginSchema,
  profileSchema,
  qualificationSchema,
  registerSchema,
} from "../src/index";

describe("registerSchema", () => {
  const base = {
    displayName: "Nadia Rahman",
    email: "  Nadia@Example.com ",
    password: "correct horse battery",
    acceptTerms: true,
    acceptPrivacy: true,
  };

  it("normalises the email", () => {
    const parsed = registerSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBe("nadia@example.com");
  });

  it("rejects a short password", () => {
    expect(registerSchema.safeParse({ ...base, password: "short" }).success).toBe(false);
  });

  it("requires explicit consent", () => {
    expect(registerSchema.safeParse({ ...base, acceptTerms: false }).success).toBe(false);
  });

  it("rejects malformed email", () => {
    expect(registerSchema.safeParse({ ...base, email: "not-an-email" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts a normal login", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("accepts an empty optional profile", () => {
    expect(profileSchema.safeParse({ preferredCountryIds: [] }).success).toBe(true);
  });

  it("caps preferred destinations at five", () => {
    const result = profileSchema.safeParse({
      preferredCountryIds: ["a", "b", "c", "d", "e", "f"],
    });
    expect(result.success).toBe(false);
  });
});

describe("qualificationSchema", () => {
  it("accepts predicted subject results", () => {
    const result = qualificationSchema.safeParse({
      qualificationTypeId: "q1",
      status: "IN_PROGRESS",
      subjectResults: [{ subjectId: "s1", gradeLabel: "A*", kind: "PREDICTED" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown result kind", () => {
    const result = qualificationSchema.safeParse({
      qualificationTypeId: "q1",
      status: "COMPLETED",
      subjectResults: [{ subjectId: "s1", gradeLabel: "A", kind: "GUESS" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("languageTestSchema", () => {
  it("upper-cases the test code", () => {
    const parsed = languageTestSchema.safeParse({ testCode: "ielts", score: "7.0" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.testCode).toBe("IELTS");
  });
});
