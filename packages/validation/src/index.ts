import { z } from "zod";

export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 200;

const email = z.string().trim().toLowerCase().max(EMAIL_MAX).pipe(z.email());
const displayName = z.string().trim().min(2).max(80);
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const isoCurrency = z.string().regex(/^[A-Z]{3}$/, "Use a 3-letter ISO 4217 code");

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`)
  .max(PASSWORD_MAX);

export const registerSchema = z.object({
  displayName,
  email,
  password: passwordSchema,
  acceptTerms: z.literal(true, { message: "You need to accept the terms" }),
  acceptPrivacy: z.literal(true, { message: "You need to accept the privacy notice" }),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(PASSWORD_MAX),
  next: z.string().optional(),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1).max(PASSWORD_MAX),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1).max(PASSWORD_MAX),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "The new passwords do not match",
    path: ["confirmPassword"],
  });

export const deleteAccountSchema = z.object({
  password: z.string().min(1).max(PASSWORD_MAX),
  confirmation: z.literal("DELETE", { message: "Type DELETE to confirm" }),
});

export const degreeLevels = [
  "FOUNDATION",
  "UNDERGRADUATE",
  "POSTGRADUATE",
  "DOCTORAL",
  "DIPLOMA",
  "CERTIFICATE",
  "OTHER",
] as const;

export const qualificationLevels = [
  "SECONDARY",
  "UPPER_SECONDARY",
  "POST_SECONDARY",
  "UNDERGRADUATE",
  "POSTGRADUATE",
  "VOCATIONAL",
  "LANGUAGE",
  "OTHER",
] as const;

export const qualificationStatuses = [
  "IN_PROGRESS",
  "COMPLETED",
  "PARTIALLY_COMPLETED",
  "NOT_COMPLETED",
  "AWARDED",
] as const;

export const resultKinds = ["ACHIEVED", "PREDICTED", "ESTIMATED"] as const;

export const financialNeedLevels = ["LOW", "MEDIUM", "HIGH", "PREFER_NOT_TO_SAY"] as const;

export const profileSchema = z.object({
  displayName: z.string().trim().max(80).optional(),
  dateOfBirth: dateOnly.optional().or(z.literal("")),
  countryOfResidenceId: z.string().min(1).optional().or(z.literal("")),
  nationalityCountryId: z.string().min(1).optional().or(z.literal("")),
  intendedDegreeLevel: z.enum(degreeLevels).optional().or(z.literal("")),
  intendedSubjectId: z.string().min(1).optional().or(z.literal("")),
  financialNeedLevel: z.enum(financialNeedLevels).optional().or(z.literal("")),
  preferredCountryIds: z.array(z.string().min(1)).max(5).default([]),
});

export const subjectResultSchema = z.object({
  subjectId: z.string().min(1),
  gradeLabel: z.string().trim().min(1).max(40),
  gradeRank: z.coerce.number().int().min(0).max(1000).optional(),
  kind: z.enum(resultKinds).default("ACHIEVED"),
});

export const qualificationSchema = z.object({
  qualificationTypeId: z.string().min(1),
  awardingBodyId: z.string().min(1).optional().or(z.literal("")),
  gradeScaleId: z.string().min(1).optional().or(z.literal("")),
  status: z.enum(qualificationStatuses),
  sessionYear: z.coerce.number().int().min(1950).max(2100).optional(),
  sessionSeries: z.string().trim().max(40).optional(),
  overallGradeLabel: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(1000).optional(),
  subjectResults: z.array(subjectResultSchema).max(40).default([]),
});

export const languageTestSchema = z.object({
  testCode: z.string().trim().min(2).max(20).toUpperCase(),
  score: z.string().trim().min(1).max(20),
  scaleNote: z.string().trim().max(120).optional(),
  testDate: dateOnly.optional().or(z.literal("")),
  expiresAt: dateOnly.optional().or(z.literal("")),
});

export const applicationStatuses = [
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
] as const;

export const applicationSchema = z.object({
  title: z.string().trim().min(2).max(160),
  programmeId: z.string().min(1).optional().or(z.literal("")),
  scholarshipId: z.string().min(1).optional().or(z.literal("")),
  deadline: dateOnly.optional().or(z.literal("")),
  feeAmount: z.coerce.number().min(0).max(1_000_000).optional(),
  feeCurrency: isoCurrency.optional().or(z.literal("")),
  status: z.enum(applicationStatuses).default("INTERESTED"),
});

export const applicationStatusSchema = z.object({
  status: z.enum(applicationStatuses),
});

export const saveOpportunitySchema = z.object({
  kind: z.enum(["UNIVERSITY", "PROGRAMME", "SCHOLARSHIP"]),
  targetId: z.string().min(1),
});

export const notificationPreferencesSchema = z.object({
  inApp: z.boolean().default(true),
  email: z.boolean().default(false),
  deadlineReminders: z.boolean().default(true),
  dataChangeAlerts: z.boolean().default(true),
});

export const reviewDecisionSchema = z.object({
  reviewId: z.string().min(1),
  note: z.string().trim().max(1000).optional(),
});

export const candidatePromotionSchema = z.object({
  reviewId: z.string().min(1),
  name: z.string().trim().min(2).max(400),
  city: z.string().trim().min(1).max(120),
  countryCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, "Use the two-letter country code"),
  websiteUrl: z.url("Use a full https:// address"),
  note: z.string().trim().max(1000).optional(),
});

export const adminVerificationSchema = z.object({
  entityType: z.enum([
    "Programme",
    "Scholarship",
    "AdmissionRequirement",
    "LanguageRequirement",
    "ProgrammeDeadline",
    "TuitionFee",
    "ScholarshipEligibilityRule",
    "ScholarshipDeadline",
    "ScholarshipFundingComponent",
  ]),
  entityId: z.string().min(1),
  status: z.enum([
    "VERIFIED",
    "PARTIALLY_VERIFIED",
    "PENDING_REVIEW",
    "CONFLICTING",
    "STALE",
    "ARCHIVED",
  ]),
  sourceUrl: z.url().optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional(),
});

export const programmeCreateSchema = z.object({
  universityId: z.string().min(1, "Pick a university"),
  title: z.string().trim().min(2).max(300),
  degreeLevel: z.enum(degreeLevels),
  durationMonths: z.coerce.number().int().min(1).max(144).optional(),
  officialUrl: z.url("Use the full https:// address"),
  sourceUrl: z.url("Use the full https:// address"),
  tuitionSummary: z.string().trim().max(300).optional(),
});

export const programmeEditSchema = programmeCreateSchema.extend({
  id: z.string().min(1),
});

export const scholarshipCreateSchema = z.object({
  name: z.string().trim().min(2).max(300),
  providerName: z.string().trim().min(2).max(300),
  hostCountryId: z.string().min(1).optional().or(z.literal("")),
  degreeLevels: z.array(z.enum(degreeLevels)).max(7).default([]),
  officialUrl: z.url("Use the full https:// address"),
  sourceUrl: z.url("Use the full https:// address"),
  description: z.string().trim().max(1000).optional(),
});

export const scholarshipEditSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(300),
  providerId: z.string().min(1, "Pick a provider"),
  hostCountryId: z.string().min(1).optional().or(z.literal("")),
  degreeLevels: z.array(z.enum(degreeLevels)).max(7).default([]),
  officialUrl: z.url("Use the full https:// address"),
  sourceUrl: z.url("Use the full https:// address"),
  description: z.string().trim().max(1000).optional(),
});

export const scholarshipProviderEditSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(300),
  type: z.enum(["GOVERNMENT", "UNIVERSITY", "PRIVATE", "FOUNDATION", "CHARITY", "OTHER"]),
  countryId: z.string().min(1).optional().or(z.literal("")),
  websiteUrl: z.url("Use the full https:// address").optional().or(z.literal("")),
  sourceUrl: z.url("Use the full https:// address").optional().or(z.literal("")),
});

export const universityEditSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(300),
  officialName: z.string().trim().max(400).optional().or(z.literal("")),
  countryId: z.string().min(1, "Pick a country"),
  city: z.string().trim().min(1).max(120),
  websiteUrl: z.url("Use the full https:// address"),
  type: z.enum(["PUBLIC", "PRIVATE", "OTHER"]),
  sourceUrl: z.url("Use the full https:// address").optional().or(z.literal("")),
});

export const requirementKinds = [
  "QUALIFICATION",
  "SUBJECT",
  "GRADE",
  "LANGUAGE",
  "NATIONALITY",
  "RESIDENCY",
  "AGE",
  "FINANCIAL_NEED",
  "DEGREE_LEVEL",
  "SUBJECT_AREA",
  "OTHER",
] as const;

export const fundingComponents = [
  "TUITION",
  "STIPEND",
  "ACCOMMODATION",
  "MEALS",
  "HEALTH_INSURANCE",
  "AIRFARE",
  "VISA_FEES",
  "TRAVEL",
  "BOOKS",
  "RESEARCH",
  "OTHER",
] as const;

export const coverageTypes = ["FULL", "PARTIAL", "FIXED_AMOUNT", "UNSPECIFIED"] as const;

const dateTimeInput = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || !Number.isNaN(new Date(value).getTime()),
    "Use a valid date and time",
  );

export const admissionRequirementSchema = z.object({
  programmeId: z.string().min(1),
  kind: z.enum(requirementKinds),
  label: z.string().trim().min(2).max(200),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  qualificationTypeId: z.string().min(1).optional().or(z.literal("")),
  subjectId: z.string().min(1).optional().or(z.literal("")),
  gradeScaleId: z.string().min(1).optional().or(z.literal("")),
  minimumGradeLabel: z.string().trim().max(40).optional().or(z.literal("")),
  minimumGradeRank: z.coerce.number().int().min(0).max(1000).optional(),
  isMandatory: z.coerce.boolean().default(true),
  sourceUrl: z.url("Use the full https:// address"),
});

export const admissionRequirementEditSchema = admissionRequirementSchema
  .omit({ programmeId: true })
  .extend({ id: z.string().min(1) });

export const languageRequirementSchema = z.object({
  programmeId: z.string().min(1),
  testCode: z.string().trim().min(2).max(20).toUpperCase(),
  minimumScore: z.string().trim().min(1).max(20),
  scaleNote: z.string().trim().max(120).optional().or(z.literal("")),
  isMandatory: z.coerce.boolean().default(true),
  sourceUrl: z.url("Use the full https:// address"),
});

export const languageRequirementEditSchema = languageRequirementSchema
  .omit({ programmeId: true })
  .extend({ id: z.string().min(1) });

export const programmeDeadlineSchema = z.object({
  programmeId: z.string().min(1),
  label: z.string().trim().min(1).max(160),
  intake: z.string().trim().max(80).optional().or(z.literal("")),
  opensAt: dateTimeInput.optional(),
  closesAt: dateTimeInput.optional(),
  timezone: z.string().trim().min(1).max(60).default("UTC"),
  sourceUrl: z.url("Use the full https:// address"),
});

export const programmeDeadlineEditSchema = programmeDeadlineSchema
  .omit({ programmeId: true })
  .extend({ id: z.string().min(1) });

export const tuitionFeeSchema = z.object({
  programmeId: z.string().min(1),
  amount: z.coerce.number().min(0).max(10_000_000).optional(),
  currencyCode: isoCurrency,
  period: z.string().trim().min(1).max(20).default("YEAR"),
  isInternational: z.coerce.boolean().default(true),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
  sourceUrl: z.url("Use the full https:// address"),
});

export const tuitionFeeEditSchema = tuitionFeeSchema
  .omit({ programmeId: true })
  .extend({ id: z.string().min(1) });

export const scholarshipEligibilityRuleSchema = z.object({
  scholarshipId: z.string().min(1),
  kind: z.enum(requirementKinds),
  label: z.string().trim().min(2).max(200),
  valueString: z.string().trim().max(300).optional().or(z.literal("")),
  minValue: z.coerce.number().min(-1000).max(100_000).optional(),
  isMandatory: z.coerce.boolean().default(true),
  sourceUrl: z.url("Use the full https:// address"),
});

export const scholarshipEligibilityRuleEditSchema = scholarshipEligibilityRuleSchema
  .omit({ scholarshipId: true })
  .extend({ id: z.string().min(1) });

export const scholarshipFundingComponentSchema = z.object({
  scholarshipId: z.string().min(1),
  component: z.enum(fundingComponents),
  coverage: z.enum(coverageTypes).default("UNSPECIFIED"),
  amount: z.coerce.number().min(0).max(10_000_000).optional(),
  currencyCode: z.string().trim().toUpperCase().pipe(isoCurrency).optional().or(z.literal("")),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  isSpecified: z.coerce.boolean().default(false),
  sourceUrl: z.url("Use a full https:// address").optional().or(z.literal("")),
});

export const scholarshipFundingComponentEditSchema = scholarshipFundingComponentSchema
  .omit({ scholarshipId: true, component: true })
  .extend({ id: z.string().min(1) });

export const scholarshipDeadlineSchema = z.object({
  scholarshipId: z.string().min(1),
  label: z.string().trim().min(1).max(160),
  opensAt: dateTimeInput.optional(),
  closesAt: dateTimeInput.optional(),
  timezone: z.string().trim().min(1).max(60).default("UTC"),
  sourceUrl: z.url("Use the full https:// address"),
});

export const scholarshipDeadlineEditSchema = scholarshipDeadlineSchema
  .omit({ scholarshipId: true })
  .extend({ id: z.string().min(1) });

export const assistantMessageSchema = z.object({
  message: z.string().trim().min(2, "Ask a little more than that").max(2000),
  includeProfile: z.coerce.boolean().default(false),
});

export const applicationTaskSchema = z.object({
  title: z.string().trim().min(1).max(160),
  dueAt: dateOnly.optional().or(z.literal("")),
  isRequired: z.coerce.boolean().default(true),
});

export const applicationDocumentSchema = z.object({
  label: z.string().trim().min(1).max(160),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  country: z.string().trim().max(3).optional(),
  level: z.enum(degreeLevels).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
});

export const budgetPlanSchema = z.object({
  title: z.string().trim().min(2).max(120),
  targetCountryId: z.string().min(1).optional().or(z.literal("")),
  currencyCode: isoCurrency.default("USD"),
});

export const budgetItemSchema = z.object({
  category: z.enum([
    "TUITION",
    "ACCOMMODATION",
    "FOOD",
    "TRANSPORT",
    "UTILITIES",
    "INTERNET",
    "BOOKS",
    "INSURANCE",
    "VISA_FEES",
    "APPLICATION_FEES",
    "FLIGHTS",
    "PERSONAL",
    "OTHER",
  ]),
  label: z.string().trim().min(1).max(120),
  amount: z.coerce.number().min(0).max(1_000_000),
  currencyCode: isoCurrency,
  frequency: z.enum(["MONTHLY", "YEARLY", "ONE_TIME"]).default("MONTHLY"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type QualificationInput = z.infer<typeof qualificationSchema>;
export type LanguageTestInput = z.infer<typeof languageTestSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
