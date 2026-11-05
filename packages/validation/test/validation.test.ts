import { describe, expect, it } from "vitest";
import {
  applicationDocumentSchema,
  applicationTaskSchema,
  assistantMessageSchema,
  languageTestSchema,
  loginSchema,
  profileSchema,
  programmeCreateSchema,
  qualificationSchema,
  registerSchema,
  scholarshipCreateSchema,
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

describe("applicationTaskSchema", () => {
  it("defaults isRequired to true when the field is absent", () => {
    const parsed = applicationTaskSchema.safeParse({ title: "Ask for a reference" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.isRequired).toBe(true);
  });

  it("rejects a task without a title", () => {
    expect(applicationTaskSchema.safeParse({ title: "  " }).success).toBe(false);
  });
});

describe("assistantMessageSchema", () => {
  it("keeps the profile opt-in off by default", () => {
    const parsed = assistantMessageSchema.safeParse({ message: "Which programme fits me?" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.includeProfile).toBe(false);
  });

  it("rejects a one-character message", () => {
    expect(assistantMessageSchema.safeParse({ message: "?" }).success).toBe(false);
  });
});

describe("applicationDocumentSchema", () => {
  it("trims the label", () => {
    const parsed = applicationDocumentSchema.safeParse({ label: "  Transcript  " });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.label).toBe("Transcript");
  });
});

describe("programmeCreateSchema", () => {
  const base = {
    universityId: "u1",
    title: "BSc Computer Science",
    degreeLevel: "UNDERGRADUATE",
    officialUrl: "https://example.edu/bsc",
    sourceUrl: "https://example.edu/bsc",
  };

  it("accepts a record without a duration", () => {
    const parsed = programmeCreateSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.durationMonths).toBeUndefined();
  });

  it("rejects a source that is not a URL", () => {
    expect(programmeCreateSchema.safeParse({ ...base, sourceUrl: "not a url" }).success).toBe(
      false,
    );
  });

  it("rejects an unknown degree level", () => {
    expect(programmeCreateSchema.safeParse({ ...base, degreeLevel: "BACHELOR" }).success).toBe(
      false,
    );
  });
});

describe("scholarshipCreateSchema", () => {
  const base = {
    name: "Example Global Scholarship",
    providerName: "Example Foundation",
    officialUrl: "https://example.org/scholarship",
    sourceUrl: "https://example.org/scholarship",
  };

  it("defaults degree levels to an empty list", () => {
    const parsed = scholarshipCreateSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.degreeLevels).toEqual([]);
  });

  it("keeps only known degree levels", () => {
    expect(
      scholarshipCreateSchema.safeParse({ ...base, degreeLevels: ["UNDERGRADUATE", "PHD"] })
        .success,
    ).toBe(false);
  });
});
