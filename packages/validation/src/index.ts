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
  confirmation: z.literal("DELETE", { message: 'Type DELETE to confirm' }),
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

export const adminVerificationSchema = z.object({
  entityType: z.enum(["University", "Programme", "Scholarship", "VisaCategory"]),
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
