export type VerificationStatusValue =
  | "UNVERIFIED"
  | "PARTIALLY_VERIFIED"
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "CONFLICTING"
  | "STALE"
  | "ARCHIVED";

export type RequirementKindValue =
  | "QUALIFICATION"
  | "SUBJECT"
  | "GRADE"
  | "LANGUAGE"
  | "NATIONALITY"
  | "RESIDENCY"
  | "AGE"
  | "FINANCIAL_NEED"
  | "DEGREE_LEVEL"
  | "SUBJECT_AREA"
  | "OTHER";

export type RequirementStatusValue =
  "MET" | "NOT_MET" | "UNKNOWN" | "NEEDS_CONFIRMATION" | "NOT_APPLICABLE";

export type MatchOutcomeValue =
  "ELIGIBLE" | "POTENTIALLY_ELIGIBLE" | "NOT_CURRENTLY_ELIGIBLE" | "UNVERIFIED";

export type QualificationLevelValue =
  | "SECONDARY"
  | "UPPER_SECONDARY"
  | "POST_SECONDARY"
  | "UNDERGRADUATE"
  | "POSTGRADUATE"
  | "VOCATIONAL"
  | "LANGUAGE"
  | "OTHER";

export type QualificationStatusValue =
  "IN_PROGRESS" | "COMPLETED" | "PARTIALLY_COMPLETED" | "NOT_COMPLETED" | "AWARDED";

export type ResultKindValue = "ACHIEVED" | "PREDICTED" | "ESTIMATED";

export interface StudentSubjectResult {
  subjectCode: string;
  subjectName: string;
  gradeLabel: string;
  gradeRank: number | null;
  kind: ResultKindValue;
}

export interface StudentQualification {
  qualificationTypeCode: string;
  level: QualificationLevelValue;
  status: QualificationStatusValue;
  gradeScaleCode: string | null;
  overallGradeLabel: string | null;
  overallGradeRank: number | null;
  results: StudentSubjectResult[];
}

export interface StudentLanguageTest {
  testCode: string;
  score: string;
  expiresAt: string | null;
}

export interface StudentSnapshot {
  nationalityCountryCode: string | null;
  residenceCountryCode: string | null;
  dateOfBirth: string | null;
  intendedDegreeLevel: string | null;
  financialNeedLevel: string | null;
  languageTests: StudentLanguageTest[];
  qualifications: StudentQualification[];
}

export interface OpportunityRequirement {
  key: string;
  label: string;
  kind: RequirementKindValue;
  isMandatory: boolean;
  sourceUrl: string | null;
  verificationStatus: VerificationStatusValue;
  lastCheckedAt: string | null;

  qualificationTypeCodes?: string[];
  requiredLevel?: QualificationLevelValue | null;
  subjectCodes?: string[];
  matchMode?: "ANY" | "ALL";
  minimumGradeLabel?: string | null;
  minimumGradeRank?: number | null;
  gradeScaleCode?: string | null;
  languageTestCode?: string | null;
  minimumScore?: string | null;
  nationalityCodes?: string[] | null;
  residencyCodes?: string[] | null;
  minAge?: number | null;
  maxAge?: number | null;
  valueString?: string | null;
}

export interface OpportunitySnapshot {
  kind: "PROGRAMME" | "SCHOLARSHIP";
  id: string;
  title: string;
  verificationStatus: VerificationStatusValue;
  officialUrl: string | null;
  requirements: OpportunityRequirement[];
}

export interface RequirementEvaluation {
  key: string;
  label: string;
  kind: RequirementKindValue;
  isMandatory: boolean;
  status: RequirementStatusValue;
  evidence: string;
  sourceUrl: string | null;
  lastCheckedAt: string | null;
}

export interface MatchEvaluation {
  outcome: MatchOutcomeValue;
  engineVersion: string;
  summary: string;
  completeness: number;
  results: RequirementEvaluation[];
  met: RequirementEvaluation[];
  unmet: RequirementEvaluation[];
  unknown: RequirementEvaluation[];
  needsConfirmation: RequirementEvaluation[];
  nextSteps: string[];
}

export interface MatchingEngineOptions {
  asOf?: Date;
  staleAfterDays?: number;
  engineVersion?: string;
}
