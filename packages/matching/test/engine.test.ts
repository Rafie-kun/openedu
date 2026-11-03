import { describe, expect, it } from "vitest";
import { ENGINE_VERSION, evaluateOpportunity } from "../src/engine";
import type {
  OpportunityRequirement,
  OpportunitySnapshot,
  QualificationLevelValue,
  StudentQualification,
  StudentSnapshot,
} from "../src/types";

const CHECKED = "2026-06-01T00:00:00.000Z";
const AS_OF = new Date("2026-11-02T00:00:00.000Z");

function requirement(overrides: Partial<OpportunityRequirement> = {}): OpportunityRequirement {
  return {
    key: "req",
    label: "A requirement",
    kind: "QUALIFICATION",
    isMandatory: true,
    sourceUrl: "https://example.edu/admissions",
    verificationStatus: "VERIFIED",
    lastCheckedAt: CHECKED,
    ...overrides,
  };
}

function student(overrides: Partial<StudentSnapshot> = {}): StudentSnapshot {
  return {
    nationalityCountryCode: "BD",
    residenceCountryCode: "BD",
    dateOfBirth: "2007-04-12",
    intendedDegreeLevel: "UNDERGRADUATE",
    financialNeedLevel: "HIGH",
    languageTests: [{ testCode: "IELTS", score: "7.0", expiresAt: "2027-01-01T00:00:00.000Z" }],
    qualifications: [aLevels()],
    ...overrides,
  };
}

function aLevels(overrides: Partial<StudentQualification> = {}): StudentQualification {
  return {
    qualificationTypeCode: "CAIE_A_LEVEL",
    level: "UPPER_SECONDARY" as QualificationLevelValue,
    status: "COMPLETED",
    gradeScaleCode: "CAIE_AL",
    overallGradeLabel: "A",
    overallGradeRank: 5,
    results: [
      {
        subjectCode: "MATH",
        subjectName: "Mathematics",
        gradeLabel: "A",
        gradeRank: 5,
        kind: "ACHIEVED",
      },
      {
        subjectCode: "PHYS",
        subjectName: "Physics",
        gradeLabel: "B",
        gradeRank: 4,
        kind: "ACHIEVED",
      },
    ],
    ...overrides,
  };
}

function opportunity(
  requirements: OpportunityRequirement[],
  overrides: Partial<OpportunitySnapshot> = {},
): OpportunitySnapshot {
  return {
    kind: "PROGRAMME",
    id: "p1",
    title: "BSc Computer Science",
    verificationStatus: "VERIFIED",
    officialUrl: "https://example.edu/bsc-cs",
    requirements,
    ...overrides,
  };
}

const aLevelRequirement = requirement({
  key: "qual",
  label: "A Level qualification",
  kind: "QUALIFICATION",
  qualificationTypeCodes: ["CAIE_A_LEVEL"],
});

const mathsRequirement = requirement({
  key: "subject",
  label: "Mathematics at A Level",
  kind: "SUBJECT",
  subjectCodes: ["MATH"],
});

const mathsGradeRequirement = requirement({
  key: "grade",
  label: "Grade B in Mathematics",
  kind: "GRADE",
  subjectCodes: ["MATH"],
  minimumGradeLabel: "B",
  minimumGradeRank: 4,
  gradeScaleCode: "CAIE_AL",
});

const ieltsRequirement = requirement({
  key: "ielts",
  label: "IELTS 6.5 overall",
  kind: "LANGUAGE",
  languageTestCode: "IELTS",
  minimumScore: "6.5",
});

describe("evaluateOpportunity", () => {
  it("marks a fully satisfied, verified opportunity eligible", () => {
    const evaluation = evaluateOpportunity(
      opportunity([aLevelRequirement, mathsRequirement, mathsGradeRequirement, ieltsRequirement]),
      student(),
      { asOf: AS_OF },
    );

    expect(evaluation.outcome).toBe("ELIGIBLE");
    expect(evaluation.completeness).toBe(1);
    expect(evaluation.results.every((item) => item.status === "MET")).toBe(true);
    expect(evaluation.engineVersion).toBe(ENGINE_VERSION);
  });

  it("never turns eligibility into a promise", () => {
    const evaluation = evaluateOpportunity(opportunity([aLevelRequirement]), student(), {
      asOf: AS_OF,
    });
    expect(evaluation.summary).toContain("not an offer");
  });

  it("fails a missing mandatory subject and explains it", () => {
    const evaluation = evaluateOpportunity(
      opportunity([
        aLevelRequirement,
        requirement({ key: "chem", label: "Chemistry at A Level", kind: "SUBJECT", subjectCodes: ["CHEM"] }),
      ]),
      student(),
      { asOf: AS_OF },
    );

    expect(evaluation.outcome).toBe("NOT_CURRENTLY_ELIGIBLE");
    const unmet = evaluation.unmet.find((item) => item.key === "chem");
    expect(unmet?.evidence).toContain("CHEM");
    expect(evaluation.nextSteps.length).toBeGreaterThan(0);
  });

  it("asks for confirmation when the language test is missing", () => {
    const evaluation = evaluateOpportunity(
      opportunity([aLevelRequirement, ieltsRequirement]),
      student({ languageTests: [] }),
      { asOf: AS_OF },
    );

    expect(evaluation.outcome).toBe("POTENTIALLY_ELIGIBLE");
    expect(evaluation.unknown.map((item) => item.key)).toContain("ielts");
  });

  it("fails an expired language test instead of accepting it", () => {
    const evaluation = evaluateOpportunity(
      opportunity([ieltsRequirement]),
      student({
        languageTests: [{ testCode: "IELTS", score: "7.5", expiresAt: "2025-01-01T00:00:00.000Z" }],
      }),
      { asOf: AS_OF },
    );

    expect(evaluation.outcome).toBe("NOT_CURRENTLY_ELIGIBLE");
    expect(evaluation.unmet[0]?.evidence).toContain("expired");
  });

  it("does not treat an unverified requirement as met", () => {
    const evaluation = evaluateOpportunity(
      opportunity([
        aLevelRequirement,
        requirement({ ...ieltsRequirement, verificationStatus: "UNVERIFIED" }),
      ]),
      student(),
      { asOf: AS_OF },
    );

    expect(evaluation.outcome).toBe("POTENTIALLY_ELIGIBLE");
    const ielts = evaluation.needsConfirmation.find((item) => item.key === "ielts");
    expect(ielts?.evidence).toContain("not been verified");
  });

  it("marks stale source checks for confirmation", () => {
    const evaluation = evaluateOpportunity(
      opportunity([requirement({ ...aLevelRequirement, lastCheckedAt: "2023-01-01T00:00:00.000Z" })]),
      student(),
      { asOf: AS_OF },
    );

    expect(evaluation.outcome).toBe("POTENTIALLY_ELIGIBLE");
    expect(evaluation.needsConfirmation[0]?.evidence).toContain("older than 365 days");
  });

  it("keeps an in-progress qualification open rather than passing it", () => {
    const evaluation = evaluateOpportunity(
      opportunity([aLevelRequirement]),
      student({ qualifications: [aLevels({ status: "IN_PROGRESS" })] }),
      { asOf: AS_OF },
    );

    expect(evaluation.outcome).toBe("POTENTIALLY_ELIGIBLE");
    expect(evaluation.results[0]?.status).toBe("NEEDS_CONFIRMATION");
  });

  it("refuses to convert between grade scales", () => {
    const evaluation = evaluateOpportunity(
      opportunity([mathsGradeRequirement]),
      student({ qualifications: [aLevels({ gradeScaleCode: "IB_45" })] }),
      { asOf: AS_OF },
    );

    expect(evaluation.results[0]?.status).toBe("UNKNOWN");
    expect(evaluation.results[0]?.evidence).toContain("does not convert");
    expect(evaluation.outcome).toBe("POTENTIALLY_ELIGIBLE");
  });

  it("fails a nationality restriction with a clear reason", () => {
    const evaluation = evaluateOpportunity(
      opportunity([
        requirement({
          key: "nat",
          label: "Open to specific nationalities",
          kind: "NATIONALITY",
          nationalityCodes: ["NP", "LK"],
        }),
      ]),
      student(),
      { asOf: AS_OF },
    );

    expect(evaluation.outcome).toBe("NOT_CURRENTLY_ELIGIBLE");
    expect(evaluation.unmet[0]?.evidence).toContain("not listed as eligible");
  });

  it("does not guess nationality when it is not supplied", () => {
    const evaluation = evaluateOpportunity(
      opportunity([
        requirement({ key: "nat", label: "Nationality", kind: "NATIONALITY", nationalityCodes: ["BD"] }),
      ]),
      student({ nationalityCountryCode: null }),
      { asOf: AS_OF },
    );

    expect(evaluation.results[0]?.status).toBe("UNKNOWN");
    expect(evaluation.outcome).toBe("POTENTIALLY_ELIGIBLE");
  });

  it("flags conflicting sources instead of picking a winner", () => {
    const evaluation = evaluateOpportunity(
      opportunity([
        requirement({ ...ieltsRequirement, verificationStatus: "CONFLICTING" }),
      ]),
      student(),
      { asOf: AS_OF },
    );

    expect(evaluation.results[0]?.status).toBe("NEEDS_CONFIRMATION");
    expect(evaluation.results[0]?.evidence).toContain("Sources disagree");
    expect(evaluation.outcome).toBe("POTENTIALLY_ELIGIBLE");
  });

  it("returns unverified when the opportunity has no recorded requirements", () => {
    const evaluation = evaluateOpportunity(opportunity([]), student(), { asOf: AS_OF });
    expect(evaluation.outcome).toBe("UNVERIFIED");
    expect(evaluation.completeness).toBe(0);
  });

  it("returns unverified when the opportunity itself is conflicting", () => {
    const evaluation = evaluateOpportunity(
      opportunity([aLevelRequirement], { verificationStatus: "CONFLICTING" }),
      student(),
      { asOf: AS_OF },
    );

    expect(evaluation.outcome).toBe("UNVERIFIED");
  });

  it("separates optional requirements from blocking ones", () => {
    const evaluation = evaluateOpportunity(
      opportunity([
        aLevelRequirement,
        requirement({
          key: "optional-doc",
          label: "Optional portfolio",
          kind: "OTHER",
          isMandatory: false,
        }),
      ]),
      student(),
      { asOf: AS_OF },
    );

    expect(evaluation.outcome).toBe("ELIGIBLE");
    expect(evaluation.needsConfirmation.map((item) => item.key)).toContain("optional-doc");
  });

  it("checks age against the as-of date", () => {
    const evaluation = evaluateOpportunity(
      opportunity([requirement({ key: "age", label: "Under 21", kind: "AGE", maxAge: 20 })]),
      student({ dateOfBirth: "2005-04-12" }),
      { asOf: AS_OF },
    );

    expect(evaluation.outcome).toBe("NOT_CURRENTLY_ELIGIBLE");
    expect(evaluation.unmet[0]?.evidence).toContain("maximum age is 20");
  });

  it("keeps grade requirements open when only predicted results exist", () => {
    const predicted = aLevels({
      status: "IN_PROGRESS",
      results: [
        {
          subjectCode: "MATH",
          subjectName: "Mathematics",
          gradeLabel: "A",
          gradeRank: 5,
          kind: "PREDICTED",
        },
      ],
    });
    const evaluation = evaluateOpportunity(
      opportunity([mathsGradeRequirement]),
      student({ qualifications: [predicted] }),
      { asOf: AS_OF },
    );

    expect(evaluation.results[0]?.status).toBe("NEEDS_CONFIRMATION");
    expect(evaluation.outcome).toBe("POTENTIALLY_ELIGIBLE");
  });

  it("records the source for each requirement result", () => {
    const evaluation = evaluateOpportunity(opportunity([aLevelRequirement]), student(), {
      asOf: AS_OF,
    });
    expect(evaluation.results[0]?.sourceUrl).toBe("https://example.edu/admissions");
    expect(evaluation.results[0]?.lastCheckedAt).toBe(CHECKED);
  });
});
