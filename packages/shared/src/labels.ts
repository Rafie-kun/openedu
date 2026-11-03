export const APP_NAME = "EduBuf";
export const APP_TAGLINE = "A quiet workspace for a very big decision.";

export type VerificationStatusValue =
  | "UNVERIFIED"
  | "PARTIALLY_VERIFIED"
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "CONFLICTING"
  | "STALE"
  | "ARCHIVED";

export const VERIFICATION_LABELS: Record<VerificationStatusValue, string> = {
  UNVERIFIED: "Not verified",
  PARTIALLY_VERIFIED: "Partly verified",
  PENDING_REVIEW: "Pending review",
  VERIFIED: "Verified",
  CONFLICTING: "Sources conflict",
  STALE: "Possibly out of date",
  ARCHIVED: "Archived",
};

export const VERIFICATION_EXPLANATIONS: Record<VerificationStatusValue, string> = {
  UNVERIFIED: "No reviewer has confirmed this record against its source yet.",
  PARTIALLY_VERIFIED: "Some fields are confirmed against the source; others still need review.",
  PENDING_REVIEW: "A change was detected and is waiting for a human reviewer.",
  VERIFIED: "A reviewer confirmed this record against the linked source.",
  CONFLICTING: "Two or more sources disagree. The platform does not pick a winner automatically.",
  STALE: "The last successful source check is older than this record type's freshness window.",
  ARCHIVED: "Withdrawn from the public catalogue. Kept for history.",
};

export type VerificationTone = "neutral" | "info" | "success" | "warning" | "error";

export function verificationTone(status: VerificationStatusValue): VerificationTone {
  switch (status) {
    case "VERIFIED":
      return "success";
    case "PARTIALLY_VERIFIED":
      return "info";
    case "PENDING_REVIEW":
      return "warning";
    case "CONFLICTING":
    case "STALE":
      return "warning";
    case "ARCHIVED":
      return "neutral";
    case "UNVERIFIED":
    default:
      return "neutral";
  }
}

export type MatchOutcomeValue =
  | "ELIGIBLE"
  | "POTENTIALLY_ELIGIBLE"
  | "NOT_CURRENTLY_ELIGIBLE"
  | "UNVERIFIED";

export const MATCH_OUTCOME_LABELS: Record<MatchOutcomeValue, string> = {
  ELIGIBLE: "Requirements appear to be met",
  POTENTIALLY_ELIGIBLE: "Potentially eligible — needs confirmation",
  NOT_CURRENTLY_ELIGIBLE: "A requirement is not currently met",
  UNVERIFIED: "Not enough verified information",
};

export const MATCH_OUTCOME_EXPLANATIONS: Record<MatchOutcomeValue, string> = {
  ELIGIBLE:
    "Every mandatory requirement recorded on the platform is satisfied by your profile, and those requirements are verified against a source. This is not an offer, an admission decision or a guarantee of funding.",
  POTENTIALLY_ELIGIBLE:
    "The requirements we can check are met, but at least one thing is unknown, in progress, or not yet verified. Confirm the missing items on the official page before relying on this result.",
  NOT_CURRENTLY_ELIGIBLE:
    "At least one mandatory requirement recorded on the platform is not met by your current profile. Check the explanation for details and possible alternative routes.",
  UNVERIFIED:
    "This opportunity does not have enough verified requirement data for a reliable comparison. Read the official page and treat this as research, not as an eligibility result.",
};

export function matchOutcomeTone(outcome: MatchOutcomeValue): VerificationTone {
  switch (outcome) {
    case "ELIGIBLE":
      return "success";
    case "POTENTIALLY_ELIGIBLE":
      return "info";
    case "NOT_CURRENTLY_ELIGIBLE":
      return "warning";
    case "UNVERIFIED":
    default:
      return "neutral";
  }
}

export const REQUIREMENT_KIND_LABELS = {
  QUALIFICATION: "Qualification",
  SUBJECT: "Subject",
  GRADE: "Grade",
  LANGUAGE: "Language test",
  NATIONALITY: "Nationality",
  RESIDENCY: "Country of residence",
  AGE: "Age",
  FINANCIAL_NEED: "Financial need",
  DEGREE_LEVEL: "Degree level",
  SUBJECT_AREA: "Subject area",
  OTHER: "Other requirement",
} as const;

export type RequirementKindValue = keyof typeof REQUIREMENT_KIND_LABELS;

export const REQUIREMENT_STATUS_LABELS = {
  MET: "Met",
  NOT_MET: "Not met",
  UNKNOWN: "Not supplied",
  NEEDS_CONFIRMATION: "Needs confirmation",
  NOT_APPLICABLE: "Not applicable",
} as const;

export type RequirementStatusValue = keyof typeof REQUIREMENT_STATUS_LABELS;

export const DEGREE_LEVEL_LABELS = {
  FOUNDATION: "Foundation",
  UNDERGRADUATE: "Undergraduate",
  POSTGRADUATE: "Postgraduate",
  DOCTORAL: "Doctoral",
  DIPLOMA: "Diploma",
  CERTIFICATE: "Certificate",
  OTHER: "Other",
} as const;

export type DegreeLevelValue = keyof typeof DEGREE_LEVEL_LABELS;

export const QUALIFICATION_LEVEL_LABELS = {
  SECONDARY: "Secondary",
  UPPER_SECONDARY: "Upper secondary",
  POST_SECONDARY: "Post-secondary",
  UNDERGRADUATE: "Undergraduate",
  POSTGRADUATE: "Postgraduate",
  VOCATIONAL: "Vocational",
  LANGUAGE: "Language",
  OTHER: "Other",
} as const;

export const APPLICATION_STATUS_LABELS = {
  INTERESTED: "Interested",
  RESEARCHING: "Researching",
  PREPARING: "Preparing",
  READY_TO_APPLY: "Ready to apply",
  SUBMITTED: "Submitted",
  AWAITING_DECISION: "Awaiting decision",
  INTERVIEW: "Interview stage",
  OFFER: "Offer received",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  ENROLLED: "Enrolled",
} as const;

export type ApplicationStatusValue = keyof typeof APPLICATION_STATUS_LABELS;

export const APPLICATION_STATUS_ORDER: ApplicationStatusValue[] = [
  "INTERESTED",
  "RESEARCHING",
  "PREPARING",
  "READY_TO_APPLY",
  "SUBMITTED",
  "AWAITING_DECISION",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
  "ENROLLED",
];

export const FUNDING_COMPONENT_LABELS = {
  TUITION: "Tuition",
  STIPEND: "Living stipend",
  ACCOMMODATION: "Accommodation",
  MEALS: "Meals",
  HEALTH_INSURANCE: "Health insurance",
  AIRFARE: "Airfare",
  VISA_FEES: "Visa fees",
  TRAVEL: "Travel allowance",
  BOOKS: "Books and materials",
  RESEARCH: "Research allowance",
  OTHER: "Other",
} as const;

export const COST_CATEGORY_LABELS = {
  TUITION: "Tuition",
  ACCOMMODATION: "Accommodation",
  FOOD: "Food",
  TRANSPORT: "Local transport",
  UTILITIES: "Utilities",
  INTERNET: "Internet and mobile",
  BOOKS: "Books and materials",
  INSURANCE: "Insurance",
  VISA_FEES: "Visa fees",
  APPLICATION_FEES: "Application fees",
  FLIGHTS: "Flights",
  PERSONAL: "Personal spending",
  OTHER: "Other",
} as const;

export const COST_BASIS_LABELS = {
  UNIVERSITY_PUBLISHED: "University published",
  GOVERNMENT_ESTIMATE: "Government estimate",
  THIRD_PARTY_ESTIMATE: "Third-party estimate",
  USER_ENTERED: "Your own estimate",
} as const;
