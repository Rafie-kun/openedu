import type {
  MatchEvaluation,
  MatchOutcomeValue,
  MatchingEngineOptions,
  OpportunityRequirement,
  OpportunitySnapshot,
  QualificationLevelValue,
  RequirementEvaluation,
  RequirementStatusValue,
  StudentLanguageTest,
  StudentQualification,
  StudentSnapshot,
} from "./types";

export const ENGINE_VERSION = "1.0.0";
const DEFAULT_STALE_AFTER_DAYS = 365;

const LEVEL_ORDER: Record<QualificationLevelValue, number> = {
  OTHER: 0,
  LANGUAGE: 0,
  SECONDARY: 1,
  VOCATIONAL: 2,
  UPPER_SECONDARY: 2,
  POST_SECONDARY: 3,
  UNDERGRADUATE: 4,
  POSTGRADUATE: 5,
};

const COMPLETED_STATUSES = new Set(["COMPLETED", "AWARDED", "PARTIALLY_COMPLETED"]);

function levelRank(level: QualificationLevelValue): number {
  return LEVEL_ORDER[level] ?? 0;
}

function parseScore(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.replace(",", ".").match(/\d+(\.\d+)?/);
  if (!match) return null;
  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function ageAt(dateOfBirth: string, asOf: Date): number | null {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  let age = asOf.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = asOf.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }
  return age >= 0 && age < 120 ? age : null;
}

function isStale(lastCheckedAt: string | null, asOf: Date, staleAfterDays: number): boolean {
  if (!lastCheckedAt) return true;
  const checked = new Date(lastCheckedAt);
  if (Number.isNaN(checked.getTime())) return true;
  const days = (asOf.getTime() - checked.getTime()) / 86_400_000;
  return days > staleAfterDays;
}

function isSourceSolid(requirement: OpportunityRequirement, asOf: Date, staleDays: number) {
  if (requirement.verificationStatus !== "VERIFIED") return false;
  return !isStale(requirement.lastCheckedAt, asOf, staleDays);
}

function bestAchievedRank(qualifications: StudentQualification[]): number | null {
  let best: number | null = null;
  for (const qualification of qualifications) {
    if (!COMPLETED_STATUSES.has(qualification.status)) continue;
    if (qualification.overallGradeRank === null) continue;
    if (best === null || qualification.overallGradeRank > best) {
      best = qualification.overallGradeRank;
    }
  }
  return best;
}

function result(
  requirement: OpportunityRequirement,
  status: RequirementStatusValue,
  evidence: string,
): RequirementEvaluation {
  return {
    key: requirement.key,
    label: requirement.label,
    kind: requirement.kind,
    isMandatory: requirement.isMandatory,
    status,
    evidence,
    sourceUrl: requirement.sourceUrl,
    lastCheckedAt: requirement.lastCheckedAt,
  };
}

function evaluateQualification(
  requirement: OpportunityRequirement,
  student: StudentSnapshot,
): RequirementEvaluation {
  const accepted = requirement.qualificationTypeCodes ?? [];
  const inProgress = student.qualifications.filter((q) =>
    ["IN_PROGRESS", "PARTIALLY_COMPLETED"].includes(q.status),
  );
  const held = student.qualifications.filter((q) => COMPLETED_STATUSES.has(q.status));

  const matchesAccepted = (q: StudentQualification) =>
    accepted.length === 0 || accepted.includes(q.qualificationTypeCode);

  if (held.some(matchesAccepted)) {
    return result(requirement, "MET", "A completed qualification of the required type is on your profile.");
  }

  if (requirement.requiredLevel) {
    const requiredRank = levelRank(requirement.requiredLevel);
    const heldByLevel = held.filter((q) => levelRank(q.level) >= requiredRank);
    if (heldByLevel.length > 0 && accepted.length === 0) {
      return result(
        requirement,
        "MET",
        `You have a completed qualification at ${requirement.requiredLevel.replace("_", " ").toLowerCase()} level or above.`,
      );
    }
    const pendingByLevel = inProgress.filter((q) => levelRank(q.level) >= requiredRank);
    if (pendingByLevel.length > 0) {
      return result(
        requirement,
        "NEEDS_CONFIRMATION",
        "Your qualification is still in progress, so the requirement cannot be confirmed yet.",
      );
    }
  }

  if (inProgress.some(matchesAccepted)) {
    return result(
      requirement,
      "NEEDS_CONFIRMATION",
      "The required qualification is in progress. Predicted grades do not confirm the requirement.",
    );
  }

  if (student.qualifications.length === 0) {
    return result(requirement, "UNKNOWN", "No qualifications have been added to your profile yet.");
  }

  return result(requirement, "NOT_MET", "None of your recorded qualifications match the required type.");
}

function evaluateSubject(
  requirement: OpportunityRequirement,
  student: StudentSnapshot,
): RequirementEvaluation {
  const required = requirement.subjectCodes ?? [];
  if (required.length === 0) {
    return result(requirement, "NEEDS_CONFIRMATION", "The required subjects are not recorded precisely.");
  }

  const mode = requirement.matchMode ?? "ANY";
  const achieved = new Set(
    student.qualifications
      .flatMap((q) => q.results)
      .filter((r) => r.kind === "ACHIEVED")
      .map((r) => r.subjectCode),
  );
  const predicted = new Set(
    student.qualifications
      .flatMap((q) => q.results)
      .filter((r) => r.kind !== "ACHIEVED")
      .map((r) => r.subjectCode),
  );

  const achievedHits = required.filter((code) => achieved.has(code));
  const predictedHits = required.filter((code) => predicted.has(code));
  const enough = mode === "ALL" ? achievedHits.length === required.length : achievedHits.length > 0;

  if (enough) {
    return result(requirement, "MET", `Recorded subject result matches: ${achievedHits.join(", ")}.`);
  }

  if (mode === "ALL" && achievedHits.length > 0) {
    const missing = required.filter((code) => !achieved.has(code));
    return result(requirement, "NOT_MET", `Missing required subjects: ${missing.join(", ")}.`);
  }

  if (predictedHits.length > 0) {
    return result(
      requirement,
      "NEEDS_CONFIRMATION",
      `You have predicted results for ${predictedHits.join(", ")}; achieved results are still needed.`,
    );
  }

  if (student.qualifications.length === 0) {
    return result(requirement, "UNKNOWN", "No subject results have been added yet.");
  }

  return result(requirement, "NOT_MET", `None of ${required.join(", ")} appears in your recorded results.`);
}

function evaluateGrade(
  requirement: OpportunityRequirement,
  student: StudentSnapshot,
): RequirementEvaluation {
  const requiredScale = requirement.gradeScaleCode ?? null;
  const minimumRank = requirement.minimumGradeRank ?? null;

  if (minimumRank === null || !requiredScale) {
    return result(requirement, "NEEDS_CONFIRMATION", "The minimum grade is not recorded precisely.");
  }

  const subjects = new Set(requirement.subjectCodes ?? []);
  const candidates = student.qualifications.filter((q) => q.gradeScaleCode === requiredScale);
  const onOtherScale = student.qualifications.filter(
    (q) => q.gradeScaleCode !== null && q.gradeScaleCode !== requiredScale,
  );

  if (candidates.length === 0) {
    if (onOtherScale.length > 0) {
      return result(
        requirement,
        "UNKNOWN",
        `Your grades are recorded on ${onOtherScale.map((q) => q.gradeScaleCode).join(", ")}, not on ${requiredScale}. The platform does not convert between grading systems without a documented equivalency.`,
      );
    }
    return result(requirement, "UNKNOWN", "No grade recorded on the required scale.");
  }

  let best: { rank: number; label: string; subject: string | null; predicted: boolean } | null = null;
  for (const qualification of candidates) {
    for (const subjectResult of qualification.results) {
      if (subjects.size > 0 && !subjects.has(subjectResult.subjectCode)) continue;
      if (subjectResult.gradeRank === null) continue;
      if (best === null || subjectResult.gradeRank > best.rank) {
        best = {
          rank: subjectResult.gradeRank,
          label: subjectResult.gradeLabel,
          subject: subjectResult.subjectCode,
          predicted: subjectResult.kind !== "ACHIEVED",
        };
      }
    }
    if (subjects.size === 0 && qualification.overallGradeRank !== null) {
      if (best === null || qualification.overallGradeRank > best.rank) {
        best = {
          rank: qualification.overallGradeRank,
          label: qualification.overallGradeLabel ?? "recorded grade",
          subject: null,
          predicted: false,
        };
      }
    }
  }

  if (!best) {
    return result(requirement, "UNKNOWN", "No comparable grade recorded.");
  }

  const where = best.subject ? ` in ${best.subject}` : "";
  if (best.rank >= minimumRank) {
    return result(
      requirement,
      best.predicted ? "NEEDS_CONFIRMATION" : "MET",
      `Your ${best.label}${where} reaches the recorded minimum of ${requirement.minimumGradeLabel ?? minimumRank}.`,
    );
  }

  return result(
    requirement,
    "NOT_MET",
    `Your best recorded grade${where} is ${best.label}, below the recorded minimum of ${requirement.minimumGradeLabel ?? minimumRank}.`,
  );
}

function evaluateLanguage(
  requirement: OpportunityRequirement,
  student: StudentSnapshot,
  asOf: Date,
): RequirementEvaluation {
  const testCode = requirement.languageTestCode;
  const minimum = parseScore(requirement.minimumScore);
  if (!testCode) {
    return result(requirement, "NEEDS_CONFIRMATION", "The language test is not specified.");
  }

  const matching = student.languageTests.filter((test) => test.testCode === testCode);
  if (matching.length === 0) {
    return result(requirement, "UNKNOWN", `No ${testCode} result on your profile.`);
  }

  const withScores = matching
    .map((test) => ({ test, value: parseScore(test.score) }))
    .filter((entry): entry is { test: StudentLanguageTest; value: number } => entry.value !== null);

  if (withScores.length === 0) {
    return result(requirement, "NEEDS_CONFIRMATION", `A ${testCode} result is recorded but its score is unclear.`);
  }

  const freshest = withScores.reduce((a, b) =>
    new Date(a.test.expiresAt ?? 0) > new Date(b.test.expiresAt ?? 0) ? a : b,
  );

  if (freshest.test.expiresAt) {
    const expiry = new Date(freshest.test.expiresAt);
    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() < asOf.getTime()) {
      return result(
        requirement,
        "NOT_MET",
        `Your ${testCode} result expired on ${freshest.test.expiresAt.slice(0, 10)}.`,
      );
    }
  }

  if (minimum === null) {
    return result(requirement, "NEEDS_CONFIRMATION", "The required score is not recorded precisely.");
  }

  if (freshest.value >= minimum) {
    return result(
      requirement,
      "MET",
      `Your ${testCode} score of ${freshest.value} meets the recorded minimum of ${minimum}.`,
    );
  }

  return result(
    requirement,
    "NOT_MET",
    `Your ${testCode} score of ${freshest.value} is below the recorded minimum of ${minimum}.`,
  );
}

function evaluateSimpleList(
  requirement: OpportunityRequirement,
  codes: string[] | null | undefined,
  studentValue: string | null,
  missingMessage: string,
  metMessage: string,
  unmetMessage: string,
): RequirementEvaluation {
  if (!codes || codes.length === 0) {
    return result(requirement, "NEEDS_CONFIRMATION", "This restriction is not recorded precisely.");
  }
  if (!studentValue) {
    return result(requirement, "UNKNOWN", missingMessage);
  }
  if (codes.includes(studentValue)) {
    return result(requirement, "MET", metMessage);
  }
  return result(requirement, "NOT_MET", unmetMessage);
}

function evaluateRequirement(
  requirement: OpportunityRequirement,
  student: StudentSnapshot,
  asOf: Date,
): RequirementEvaluation {
  switch (requirement.kind) {
    case "QUALIFICATION":
      return evaluateQualification(requirement, student);
    case "SUBJECT":
      return evaluateSubject(requirement, student);
    case "GRADE":
      return evaluateGrade(requirement, student);
    case "LANGUAGE":
      return evaluateLanguage(requirement, student, asOf);
    case "NATIONALITY":
      return evaluateSimpleList(
        requirement,
        requirement.nationalityCodes,
        student.nationalityCountryCode,
        "Add your nationality to check this requirement.",
        "Your nationality is listed as eligible.",
        "This nationality is not listed as eligible.",
      );
    case "RESIDENCY":
      return evaluateSimpleList(
        requirement,
        requirement.residencyCodes,
        student.residenceCountryCode,
        "Add your country of residence to check this requirement.",
        "Your country of residence is listed as eligible.",
        "Your country of residence is not listed as eligible.",
      );
    case "AGE": {
      if (!student.dateOfBirth) {
        return result(requirement, "UNKNOWN", "Add your date of birth to check the age condition.");
      }
      const age = ageAt(student.dateOfBirth, asOf);
      if (age === null) {
        return result(requirement, "UNKNOWN", "The recorded date of birth could not be read.");
      }
      if (requirement.minAge !== null && requirement.minAge !== undefined && age < requirement.minAge) {
        return result(requirement, "NOT_MET", `You are ${age}; the recorded minimum age is ${requirement.minAge}.`);
      }
      if (requirement.maxAge !== null && requirement.maxAge !== undefined && age > requirement.maxAge) {
        return result(requirement, "NOT_MET", `You are ${age}; the recorded maximum age is ${requirement.maxAge}.`);
      }
      return result(requirement, "MET", `Your age (${age}) falls inside the recorded range.`);
    }
    case "FINANCIAL_NEED": {
      const order: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
      const required = requirement.valueString ? order[requirement.valueString] : undefined;
      const actual = student.financialNeedLevel ? order[student.financialNeedLevel] : undefined;
      if (!required) {
        return result(requirement, "NEEDS_CONFIRMATION", "The recorded financial-need condition is unclear.");
      }
      if (!actual) {
        return result(requirement, "UNKNOWN", "Add your financial need level if you want this checked.");
      }
      return actual >= required
        ? result(requirement, "MET", "Your stated financial need meets the recorded condition.")
        : result(requirement, "NOT_MET", "Your stated financial need is below the recorded condition.");
    }
    case "DEGREE_LEVEL":
      return evaluateSimpleList(
        requirement,
        requirement.valueString ? [requirement.valueString] : null,
        student.intendedDegreeLevel,
        "Add the degree level you are applying for.",
        "The opportunity is open to your intended degree level.",
        "The opportunity is recorded for a different degree level.",
      );
    case "SUBJECT_AREA":
    case "OTHER":
    default:
      return result(
        requirement,
        "NEEDS_CONFIRMATION",
        "This condition cannot be checked automatically. Read the official page.",
      );
  }
}

function applyProvenance(
  requirement: OpportunityRequirement,
  evaluation: RequirementEvaluation,
  asOf: Date,
  staleDays: number,
): RequirementEvaluation {
  if (evaluation.status === "UNKNOWN" || evaluation.status === "NOT_APPLICABLE") return evaluation;

  const status = requirement.verificationStatus;
  if (status === "CONFLICTING") {
    return {
      ...evaluation,
      status: "NEEDS_CONFIRMATION",
      evidence: `${evaluation.evidence} Sources disagree about this requirement, so it needs manual confirmation.`,
    };
  }
  if (status !== "VERIFIED") {
    return {
      ...evaluation,
      status: "NEEDS_CONFIRMATION",
      evidence: `${evaluation.evidence} This requirement has not been verified against its source yet.`,
    };
  }
  if (isStale(requirement.lastCheckedAt, asOf, staleDays)) {
    return {
      ...evaluation,
      status: "NEEDS_CONFIRMATION",
      evidence: `${evaluation.evidence} The source check is older than ${staleDays} days.`,
    };
  }
  return evaluation;
}

function buildNextSteps(
  opportunity: OpportunitySnapshot,
  results: RequirementEvaluation[],
): string[] {
  const steps: string[] = [];
  const push = (step: string) => {
    if (!steps.includes(step)) steps.push(step);
  };

  for (const item of results) {
    switch (item.status) {
      case "NOT_MET":
        if (item.kind === "SUBJECT") {
          push(`Look for accepted alternatives to the missing subject on the official page${item.sourceUrl ? ` (${item.sourceUrl})` : ""}.`);
        } else if (item.kind === "LANGUAGE") {
          push("Retake the language test, or check whether a different accepted test would work.");
        } else if (item.kind === "GRADE") {
          push("Ask the institution about resits, conditional offers or a foundation route.");
        } else {
          push(`Read the requirement "${item.label}" and confirm whether any exception applies.`);
        }
        break;
      case "UNKNOWN":
        push(`Add the missing profile information so "${item.label}" can be checked.`);
        break;
      case "NEEDS_CONFIRMATION":
        push(`Confirm "${item.label}" directly with the provider${item.sourceUrl ? ` (${item.sourceUrl})` : ""}.`);
        break;
      default:
        break;
    }
  }

  if (opportunity.officialUrl) {
    push("Check the official page before relying on any of this.");
  }
  return steps;
}

function summarise(
  outcome: MatchOutcomeValue,
  results: RequirementEvaluation[],
): string {
  const mandatory = results.filter((item) => item.isMandatory);
  const met = mandatory.filter((item) => item.status === "MET").length;
  const notMet = mandatory.filter((item) => item.status === "NOT_MET").length;
  const open = mandatory.filter((item) =>
    ["UNKNOWN", "NEEDS_CONFIRMATION"].includes(item.status),
  ).length;

  if (outcome === "UNVERIFIED") {
    return "There is not enough verified requirement data to compare this opportunity with your profile. This is a research result, not an eligibility result.";
  }

  const parts = [`${met} of ${mandatory.length} mandatory requirements met`];
  if (notMet > 0) parts.push(`${notMet} not met`);
  if (open > 0) parts.push(`${open} still to confirm`);

  return `${parts.join(", ")}. Meeting requirements is not an offer, an admission decision or a funding guarantee.`;
}

export function evaluateOpportunity(
  opportunity: OpportunitySnapshot,
  student: StudentSnapshot,
  options: MatchingEngineOptions = {},
): MatchEvaluation {
  const asOf = options.asOf ?? new Date();
  const staleDays = options.staleAfterDays ?? DEFAULT_STALE_AFTER_DAYS;
  const engineVersion = options.engineVersion ?? ENGINE_VERSION;

  const results = opportunity.requirements.map((requirement) =>
    applyProvenance(requirement, evaluateRequirement(requirement, student, asOf), asOf, staleDays),
  );

  const mandatory = results.filter((item) => item.isMandatory);
  const met = results.filter((item) => item.status === "MET");
  const unmet = results.filter((item) => item.status === "NOT_MET");
  const unknown = results.filter((item) => item.status === "UNKNOWN");
  const needsConfirmation = results.filter((item) => item.status === "NEEDS_CONFIRMATION");

  let outcome: MatchOutcomeValue;
  if (mandatory.length === 0) {
    outcome = "UNVERIFIED";
  } else if (mandatory.some((item) => item.status === "NOT_MET")) {
    outcome = "NOT_CURRENTLY_ELIGIBLE";
  } else if (mandatory.some((item) => item.status !== "MET")) {
    outcome = "POTENTIALLY_ELIGIBLE";
  } else if (
    opportunity.verificationStatus === "CONFLICTING" ||
    opportunity.verificationStatus === "ARCHIVED"
  ) {
    outcome = "UNVERIFIED";
  } else {
    outcome = "ELIGIBLE";
  }

  const metMandatory = mandatory.filter((item) => item.status === "MET").length;
  const completeness = mandatory.length === 0 ? 0 : metMandatory / mandatory.length;

  return {
    outcome,
    engineVersion,
    summary: summarise(outcome, results),
    completeness: Math.round(completeness * 100) / 100,
    results,
    met,
    unmet,
    unknown,
    needsConfirmation,
    nextSteps: buildNextSteps(opportunity, results),
  };
}

export function bestRecordedGrade(student: StudentSnapshot): {
  rank: number | null;
  scale: string | null;
} {
  for (const qualification of student.qualifications) {
    if (qualification.gradeScaleCode && qualification.overallGradeRank !== null) {
      return { rank: bestAchievedRank([qualification]), scale: qualification.gradeScaleCode };
    }
  }
  return { rank: null, scale: null };
}
