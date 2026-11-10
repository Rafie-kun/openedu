import { describe, expect, it } from "vitest";
import {
  admissionRequirementEditSchema,
  admissionRequirementSchema,
  applicationDocumentSchema,
  applicationTaskSchema,
  assistantMessageSchema,
  languageRequirementSchema,
  languageTestSchema,
  loginSchema,
  programmeEditSchema,
  profileSchema,
  programmeCreateSchema,
  programmeDeadlineSchema,
  qualificationSchema,
  registerSchema,
  scholarshipCreateSchema,
  scholarshipEditSchema,
  scholarshipFundingComponentEditSchema,
  universityEditSchema,
  scholarshipDeadlineSchema,
  scholarshipEligibilityRuleSchema,
  scholarshipFundingComponentSchema,
  tuitionFeeSchema,
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

describe("admissionRequirementSchema", () => {
  const base = {
    programmeId: "p1",
    kind: "QUALIFICATION",
    label: "A Levels or equivalent",
    sourceUrl: "https://example.edu/entry",
  };

  it("accepts a row with only its label and source", () => {
    const parsed = admissionRequirementSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.isMandatory).toBe(true);
  });

  it("rejects an unknown requirement kind", () => {
    expect(admissionRequirementSchema.safeParse({ ...base, kind: "IELTS" }).success).toBe(false);
  });

  it("requires a real source URL", () => {
    expect(admissionRequirementSchema.safeParse({ ...base, sourceUrl: "" }).success).toBe(false);
  });
});

describe("languageRequirementSchema", () => {
  it("uppercases the test code", () => {
    const parsed = languageRequirementSchema.safeParse({
      programmeId: "p1",
      testCode: "ielts",
      minimumScore: "6.5",
      sourceUrl: "https://example.edu/english",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.testCode).toBe("IELTS");
  });

  it("rejects an empty minimum score", () => {
    expect(
      languageRequirementSchema.safeParse({
        programmeId: "p1",
        testCode: "TOEFL",
        minimumScore: "",
        sourceUrl: "https://example.edu/english",
      }).success,
    ).toBe(false);
  });
});

describe("programmeDeadlineSchema", () => {
  const base = {
    programmeId: "p1",
    label: "Round 1",
    sourceUrl: "https://example.edu/dates",
  };

  it("defaults the timezone to UTC", () => {
    const parsed = programmeDeadlineSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.timezone).toBe("UTC");
  });

  it("rejects an unreadable date", () => {
    expect(programmeDeadlineSchema.safeParse({ ...base, closesAt: "not a date" }).success).toBe(
      false,
    );
  });
});

describe("tuitionFeeSchema", () => {
  it("coerces a typed amount", () => {
    const parsed = tuitionFeeSchema.safeParse({
      programmeId: "p1",
      amount: "9250",
      currencyCode: "GBP",
      sourceUrl: "https://example.edu/fees",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.amount).toBe(9250);
  });

  it("rejects a currency that is not three letters", () => {
    expect(
      tuitionFeeSchema.safeParse({
        programmeId: "p1",
        currencyCode: "POUNDS",
        sourceUrl: "https://example.edu/fees",
      }).success,
    ).toBe(false);
  });
});

describe("scholarshipEligibilityRuleSchema", () => {
  const base = {
    scholarshipId: "s1",
    kind: "NATIONALITY",
    label: "Open to nationals of listed countries",
    valueString: "BD,IN,NG",
    sourceUrl: "https://example.org/eligibility",
  };

  it("keeps the comma-separated country codes as written", () => {
    const parsed = scholarshipEligibilityRuleSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.valueString).toBe("BD,IN,NG");
  });

  it("coerces a numeric minimum", () => {
    const parsed = scholarshipEligibilityRuleSchema.safeParse({
      ...base,
      kind: "GRADE",
      minValue: "3",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.minValue).toBe(3);
  });
});

describe("scholarshipFundingComponentSchema", () => {
  const base = {
    scholarshipId: "s1",
    component: "TUITION",
  };

  it("defaults coverage to unspecified and the flag to false", () => {
    const parsed = scholarshipFundingComponentSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.coverage).toBe("UNSPECIFIED");
      expect(parsed.data.isSpecified).toBe(false);
    }
  });

  it("accepts an empty currency but not a malformed one", () => {
    expect(scholarshipFundingComponentSchema.safeParse({ ...base, currencyCode: "" }).success).toBe(
      true,
    );
    expect(
      scholarshipFundingComponentSchema.safeParse({ ...base, currencyCode: "EURO" }).success,
    ).toBe(false);
  });

  it("rejects an unknown component", () => {
    expect(
      scholarshipFundingComponentSchema.safeParse({ ...base, component: "POCKET_MONEY" }).success,
    ).toBe(false);
  });
});

describe("scholarshipDeadlineSchema", () => {
  it("accepts a window with both dates", () => {
    expect(
      scholarshipDeadlineSchema.safeParse({
        scholarshipId: "s1",
        label: "Main round",
        opensAt: "2026-10-01T09:00",
        closesAt: "2027-01-15T17:00",
        sourceUrl: "https://example.org/dates",
      }).success,
    ).toBe(true);
  });

  it("rejects an unreadable date", () => {
    expect(
      scholarshipDeadlineSchema.safeParse({
        scholarshipId: "s1",
        label: "Main round",
        closesAt: "15/01/2027",
        sourceUrl: "https://example.org/dates",
      }).success,
    ).toBe(false);
  });
});

describe("edit schemas", () => {
  it("accepts a valid university edit", () => {
    expect(
      universityEditSchema.safeParse({
        id: "u1",
        name: "University of Lodz",
        countryId: "c1",
        city: "Lodz",
        websiteUrl: "https://www.uni.lodz.pl/en",
        type: "PUBLIC",
      }).success,
    ).toBe(true);
  });

  it("requires a country for a university edit", () => {
    expect(
      universityEditSchema.safeParse({
        id: "u1",
        name: "University of Lodz",
        countryId: "",
        city: "Lodz",
        websiteUrl: "https://www.uni.lodz.pl/en",
        type: "PUBLIC",
      }).success,
    ).toBe(false);
  });

  it("accepts a valid programme edit", () => {
    expect(
      programmeEditSchema.safeParse({
        id: "p1",
        universityId: "u1",
        title: "Business Management",
        degreeLevel: "UNDERGRADUATE",
        officialUrl: "https://example.org/programme",
        sourceUrl: "https://example.org/programme",
      }).success,
    ).toBe(true);
  });

  it("requires an existing provider id for a scholarship edit, not a provider name", () => {
    const parsed = scholarshipEditSchema.safeParse({
      id: "s1",
      name: "Example Scholarship",
      providerId: "prov1",
      officialUrl: "https://example.org/scholarship",
      sourceUrl: "https://example.org/scholarship",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.providerId).toBe("prov1");
  });

  it("drops the programmeId field from an admission requirement edit", () => {
    const parsed = admissionRequirementEditSchema.safeParse({
      id: "r1",
      programmeId: "should-be-ignored",
      kind: "GRADE",
      label: "Minimum grade",
      sourceUrl: "https://example.org/requirements",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect("programmeId" in parsed.data).toBe(false);
  });

  it("does not allow changing which component a funding row represents", () => {
    const parsed = scholarshipFundingComponentEditSchema.safeParse({
      id: "f1",
      component: "STIPEND",
      coverage: "PARTIAL",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect("component" in parsed.data).toBe(false);
  });
});
