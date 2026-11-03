-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'EDITOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PARTIALLY_VERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'CONFLICTING', 'STALE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('PUBLIC', 'PRIVATE', 'OTHER');

-- CreateEnum
CREATE TYPE "DegreeLevel" AS ENUM ('FOUNDATION', 'UNDERGRADUATE', 'POSTGRADUATE', 'DOCTORAL', 'DIPLOMA', 'CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('ON_CAMPUS', 'ONLINE', 'HYBRID', 'DISTANCE');

-- CreateEnum
CREATE TYPE "QualificationLevel" AS ENUM ('SECONDARY', 'UPPER_SECONDARY', 'POST_SECONDARY', 'UNDERGRADUATE', 'POSTGRADUATE', 'VOCATIONAL', 'LANGUAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "GradeKind" AS ENUM ('LETTER', 'NUMERIC', 'PERCENTAGE', 'POINTS', 'DESCRIPTIVE');

-- CreateEnum
CREATE TYPE "QualificationStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'PARTIALLY_COMPLETED', 'NOT_COMPLETED', 'AWARDED');

-- CreateEnum
CREATE TYPE "ResultKind" AS ENUM ('ACHIEVED', 'PREDICTED', 'ESTIMATED');

-- CreateEnum
CREATE TYPE "RequirementKind" AS ENUM ('QUALIFICATION', 'SUBJECT', 'GRADE', 'LANGUAGE', 'NATIONALITY', 'RESIDENCY', 'AGE', 'FINANCIAL_NEED', 'DEGREE_LEVEL', 'SUBJECT_AREA', 'OTHER');

-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('MET', 'NOT_MET', 'UNKNOWN', 'NEEDS_CONFIRMATION', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "MatchOutcome" AS ENUM ('ELIGIBLE', 'POTENTIALLY_ELIGIBLE', 'NOT_CURRENTLY_ELIGIBLE', 'UNVERIFIED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('INTERESTED', 'RESEARCHING', 'PREPARING', 'READY_TO_APPLY', 'SUBMITTED', 'AWAITING_DECISION', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN', 'ENROLLED');

-- CreateEnum
CREATE TYPE "SavedKind" AS ENUM ('UNIVERSITY', 'PROGRAMME', 'SCHOLARSHIP');

-- CreateEnum
CREATE TYPE "SourceCategory" AS ENUM ('UNIVERSITY_DIRECTORY', 'SCHOLARSHIP', 'IMMIGRATION', 'CURRENCY', 'RESEARCH_IDENTITY', 'NATIONAL_AUTHORITY', 'OTHER');

-- CreateEnum
CREATE TYPE "AccessMethod" AS ENUM ('API', 'BULK_DOWNLOAD', 'MANUAL', 'HTML_SCRAPE');

-- CreateEnum
CREATE TYPE "PermissionStatus" AS ENUM ('APPROVED', 'PENDING', 'RESTRICTED', 'PROHIBITED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "IngestionRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'PARTIAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FundingComponent" AS ENUM ('TUITION', 'STIPEND', 'ACCOMMODATION', 'MEALS', 'HEALTH_INSURANCE', 'AIRFARE', 'VISA_FEES', 'TRAVEL', 'BOOKS', 'RESEARCH', 'OTHER');

-- CreateEnum
CREATE TYPE "CoverageType" AS ENUM ('FULL', 'PARTIAL', 'FIXED_AMOUNT', 'UNSPECIFIED');

-- CreateEnum
CREATE TYPE "FinancialNeedLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "ConsentKind" AS ENUM ('TERMS', 'PRIVACY', 'AI_PROCESSING', 'MARKETING', 'ANALYTICS');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DEADLINE', 'PROFILE_GAP', 'DATA_CHANGE', 'NEW_OPPORTUNITY', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CostCategory" AS ENUM ('TUITION', 'ACCOMMODATION', 'FOOD', 'TRANSPORT', 'UTILITIES', 'INTERNET', 'BOOKS', 'INSURANCE', 'VISA_FEES', 'APPLICATION_FEES', 'FLIGHTS', 'PERSONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "CostBasis" AS ENUM ('UNIVERSITY_PUBLISHED', 'GOVERNMENT_ESTIMATE', 'THIRD_PARTY_ESTIMATE', 'USER_ENTERED');

-- CreateEnum
CREATE TYPE "BudgetFrequency" AS ENUM ('MONTHLY', 'YEARLY', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "PathwayType" AS ENUM ('FOUNDATION', 'INTERNATIONAL_FOUNDATION', 'DIPLOMA', 'PRE_UNIVERSITY', 'TRANSFER', 'BRIDGING', 'VOCATIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ScholarshipProviderType" AS ENUM ('GOVERNMENT', 'UNIVERSITY', 'PRIVATE', 'FOUNDATION', 'CHARITY', 'OTHER');

-- CreateEnum
CREATE TYPE "AIMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT false,
    "deadlineReminders" BOOLEAN NOT NULL DEFAULT true,
    "dataChangeAlerts" BOOLEAN NOT NULL DEFAULT true,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ConsentKind" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "version" TEXT NOT NULL,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitEvent" (
    "id" TEXT NOT NULL,
    "bucketKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "iso2" TEXT NOT NULL,
    "iso3" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "educationSystemSummary" TEXT,
    "officialEducationUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "sourceUrl" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualificationType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "level" "QualificationLevel" NOT NULL,
    "countryId" TEXT,
    "description" TEXT,
    "officialUrl" TEXT,
    "defaultGradeScaleId" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "sourceUrl" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualificationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AwardingBody" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryId" TEXT,
    "websiteUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "sourceUrl" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AwardingBody_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualificationAwardingBody" (
    "qualificationTypeId" TEXT NOT NULL,
    "awardingBodyId" TEXT NOT NULL,

    CONSTRAINT "QualificationAwardingBody_pkey" PRIMARY KEY ("qualificationTypeId","awardingBodyId")
);

-- CreateTable
CREATE TABLE "GradeScale" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "GradeKind" NOT NULL,
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "passValue" DOUBLE PRECISION,
    "description" TEXT,
    "sourceUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeScale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeBand" (
    "id" TEXT NOT NULL,
    "gradeScaleId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "valueNumeric" DOUBLE PRECISION,
    "description" TEXT,

    CONSTRAINT "GradeBand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualificationEquivalence" (
    "id" TEXT NOT NULL,
    "sourceScaleId" TEXT NOT NULL,
    "sourceGradeLabel" TEXT NOT NULL,
    "targetScaleId" TEXT NOT NULL,
    "targetGradeLabel" TEXT NOT NULL,
    "methodology" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "reliabilityNote" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualificationEquivalence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subjectArea" TEXT,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "countryOfResidenceId" TEXT,
    "nationalityCountryId" TEXT,
    "intendedSubjectId" TEXT,
    "intendedDegreeLevel" "DegreeLevel",
    "financialNeedLevel" "FinancialNeedLevel",
    "onboardingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentPreferredDestination" (
    "profileId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StudentPreferredDestination_pkey" PRIMARY KEY ("profileId","countryId")
);

-- CreateTable
CREATE TABLE "StudentQualification" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "qualificationTypeId" TEXT NOT NULL,
    "awardingBodyId" TEXT,
    "gradeScaleId" TEXT,
    "status" "QualificationStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "sessionYear" INTEGER,
    "sessionSeries" TEXT,
    "overallGradeLabel" TEXT,
    "overallGradeRank" INTEGER,
    "notes" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentQualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualificationSubjectResult" (
    "id" TEXT NOT NULL,
    "studentQualificationId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "gradeLabel" TEXT NOT NULL,
    "gradeRank" INTEGER,
    "kind" "ResultKind" NOT NULL DEFAULT 'ACHIEVED',
    "rawGrade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualificationSubjectResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LanguageQualification" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "testCode" TEXT NOT NULL,
    "score" TEXT NOT NULL,
    "scaleNote" TEXT,
    "testDate" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LanguageQualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "officialName" TEXT,
    "countryId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "websiteUrl" TEXT NOT NULL,
    "type" "InstitutionType" NOT NULL DEFAULT 'OTHER',
    "foundedYear" INTEGER,
    "description" TEXT,
    "internationalOfficeUrl" TEXT,
    "applicationUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "sourceUrl" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityAlias" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "UniversityAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campus" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "address" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DegreeType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "DegreeLevel" NOT NULL,

    CONSTRAINT "DegreeType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Programme" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "degreeTypeId" TEXT,
    "title" TEXT NOT NULL,
    "degreeLevel" "DegreeLevel" NOT NULL,
    "subjectArea" TEXT,
    "durationMonths" INTEGER,
    "deliveryMode" "DeliveryMode" NOT NULL DEFAULT 'ON_CAMPUS',
    "languageOfInstruction" TEXT,
    "description" TEXT,
    "officialUrl" TEXT NOT NULL,
    "applicationUrl" TEXT,
    "tuitionSummary" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "sourceUrl" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgrammeSubject" (
    "programmeId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProgrammeSubject_pkey" PRIMARY KEY ("programmeId","subjectId")
);

-- CreateTable
CREATE TABLE "ProgrammeDeadline" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "intake" TEXT,
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "sourceUrl" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgrammeDeadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TuitionFee" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "amount" DECIMAL(14,2),
    "currencyCode" TEXT NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'YEAR',
    "isInternational" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "sourceUrl" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TuitionFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionRequirement" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "kind" "RequirementKind" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "qualificationTypeId" TEXT,
    "subjectId" TEXT,
    "gradeScaleId" TEXT,
    "minimumGradeLabel" TEXT,
    "minimumGradeRank" INTEGER,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "sourceUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdmissionRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LanguageRequirement" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "testCode" TEXT NOT NULL,
    "minimumScore" TEXT NOT NULL,
    "scaleNote" TEXT,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "sourceUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LanguageRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionRecognition" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "authorityName" TEXT NOT NULL,
    "authorityCountryId" TEXT,
    "recognitionType" TEXT NOT NULL,
    "referenceUrl" TEXT NOT NULL,
    "statusNote" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionRecognition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgrammePathway" (
    "id" TEXT NOT NULL,
    "fromProgrammeId" TEXT,
    "title" TEXT NOT NULL,
    "pathwayType" "PathwayType" NOT NULL,
    "description" TEXT NOT NULL,
    "progressionGuaranteed" BOOLEAN,
    "progressionNote" TEXT,
    "gradeRequirement" TEXT,
    "durationMonths" INTEGER,
    "officialUrl" TEXT NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "sourceUrl" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgrammePathway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScholarshipProvider" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ScholarshipProviderType" NOT NULL DEFAULT 'OTHER',
    "countryId" TEXT,
    "websiteUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "sourceUrl" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScholarshipProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scholarship" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "universityId" TEXT,
    "hostCountryId" TEXT,
    "description" TEXT,
    "degreeLevels" "DegreeLevel"[] DEFAULT ARRAY[]::"DegreeLevel"[],
    "officialUrl" TEXT NOT NULL,
    "applicationUrl" TEXT,
    "applicationProcess" TEXT,
    "renewalConditions" TEXT,
    "durationMonths" INTEGER,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "sourceUrl" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScholarshipEligibilityRule" (
    "id" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "kind" "RequirementKind" NOT NULL,
    "label" TEXT NOT NULL,
    "valueString" TEXT,
    "minValue" DOUBLE PRECISION,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "sourceUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScholarshipEligibilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScholarshipFundingComponent" (
    "id" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "component" "FundingComponent" NOT NULL,
    "coverage" "CoverageType" NOT NULL DEFAULT 'UNSPECIFIED',
    "amount" DECIMAL(14,2),
    "currencyCode" TEXT,
    "description" TEXT,
    "isSpecified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ScholarshipFundingComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScholarshipDeadline" (
    "id" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "sourceUrl" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScholarshipDeadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScholarshipDocumentRequirement" (
    "id" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "ScholarshipDocumentRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScholarshipApplicationMethod" (
    "id" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "url" TEXT,
    "instructions" TEXT,

    CONSTRAINT "ScholarshipApplicationMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchingRuleVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rulesJson" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchingRuleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchResult" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "programmeId" TEXT,
    "scholarshipId" TEXT,
    "outcome" "MatchOutcome" NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "dataCompleteness" DOUBLE PRECISION,
    "summary" TEXT,
    "ruleVersionId" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchRequirementResult" (
    "id" TEXT NOT NULL,
    "matchResultId" TEXT NOT NULL,
    "requirementKey" TEXT NOT NULL,
    "requirementLabel" TEXT NOT NULL,
    "kind" "RequirementKind" NOT NULL,
    "status" "RequirementStatus" NOT NULL,
    "evidence" TEXT,
    "sourceUrl" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MatchRequirementResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentApplication" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "programmeId" TEXT,
    "scholarshipId" TEXT,
    "title" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'INTERESTED',
    "deadline" TIMESTAMP(3),
    "feeAmount" DECIMAL(14,2),
    "feeCurrency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationTask" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "isRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ApplicationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "storageKey" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "uploadedAt" TIMESTAMP(3),
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationNote" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationStatusHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "note" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedOpportunity" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "kind" "SavedKind" NOT NULL,
    "targetKey" TEXT NOT NULL,
    "universityId" TEXT,
    "programmeId" TEXT,
    "scholarshipId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organisation" TEXT NOT NULL,
    "category" "SourceCategory" NOT NULL,
    "url" TEXT NOT NULL,
    "accessMethod" "AccessMethod" NOT NULL,
    "licenceSummary" TEXT,
    "termsUrl" TEXT,
    "permissionStatus" "PermissionStatus" NOT NULL DEFAULT 'UNKNOWN',
    "attributionRequired" BOOLEAN NOT NULL DEFAULT false,
    "bulkCollectionAllowed" BOOLEAN,
    "updateFrequencyHours" INTEGER,
    "reliabilityNote" TEXT,
    "knownLimitations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lastSuccessfulRunAt" TIMESTAMP(3),
    "lastAttemptedRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionJob" (
    "id" TEXT NOT NULL,
    "dataSourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scheduleCron" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "dataSourceId" TEXT NOT NULL,
    "status" "IngestionRunStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "recordsSeen" INTEGER NOT NULL DEFAULT 0,
    "recordsCreated" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "recordsRejected" INTEGER NOT NULL DEFAULT 0,
    "errorSummary" TEXT,
    "log" JSONB,

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceRecord" (
    "id" TEXT NOT NULL,
    "dataSourceId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "payload" JSONB NOT NULL,
    "contentHash" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataVersion" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "sourceRecordId" TEXT,
    "dataSourceId" TEXT,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'OPEN',
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRecord" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL,
    "checkedById" TEXT,
    "sourceUrl" TEXT,
    "note" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewQueueItem" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "ReviewStatus" NOT NULL DEFAULT 'OPEN',
    "assignedToId" TEXT,
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ReviewQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisaCategory" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "officialUrl" TEXT NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisaCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisaRequirement" (
    "id" TEXT NOT NULL,
    "visaCategoryId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "detail" TEXT,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "sourceUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "lastCheckedAt" TIMESTAMP(3),
    "effectiveFrom" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisaRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisaSource" (
    "id" TEXT NOT NULL,
    "visaCategoryId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "VisaSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Currency" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "minorUnits" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "baseCurrencyId" TEXT NOT NULL,
    "quoteCurrencyId" TEXT NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "sourceName" TEXT NOT NULL,
    "rateDate" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostEstimate" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "city" TEXT,
    "category" "CostCategory" NOT NULL,
    "basis" "CostBasis" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'MONTH',
    "sourceUrl" TEXT NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "lastCheckedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetPlan" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetCountryId" TEXT,
    "targetProgrammeId" TEXT,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetItem" (
    "id" TEXT NOT NULL,
    "budgetPlanId" TEXT NOT NULL,
    "category" "CostCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "frequency" "BudgetFrequency" NOT NULL DEFAULT 'MONTHLY',
    "isUserEntered" BOOLEAN NOT NULL DEFAULT true,
    "sourceName" TEXT,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New conversation',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "AIMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "citations" JSONB,
    "tokenCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageRecord" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER,
    "succeeded" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "dedupeKey" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attemptedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfiguration" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_kind_idx" ON "ConsentRecord"("userId", "kind");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "RateLimitEvent_bucketKey_createdAt_idx" ON "RateLimitEvent"("bucketKey", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Country_iso2_key" ON "Country"("iso2");

-- CreateIndex
CREATE UNIQUE INDEX "Country_iso3_key" ON "Country"("iso3");

-- CreateIndex
CREATE INDEX "Country_name_idx" ON "Country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "QualificationType_code_key" ON "QualificationType"("code");

-- CreateIndex
CREATE INDEX "QualificationType_level_idx" ON "QualificationType"("level");

-- CreateIndex
CREATE INDEX "QualificationType_countryId_idx" ON "QualificationType"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "AwardingBody_code_key" ON "AwardingBody"("code");

-- CreateIndex
CREATE UNIQUE INDEX "GradeScale_code_key" ON "GradeScale"("code");

-- CreateIndex
CREATE UNIQUE INDEX "GradeBand_gradeScaleId_label_key" ON "GradeBand"("gradeScaleId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "GradeBand_gradeScaleId_rank_key" ON "GradeBand"("gradeScaleId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "QualificationEquivalence_sourceScaleId_sourceGradeLabel_tar_key" ON "QualificationEquivalence"("sourceScaleId", "sourceGradeLabel", "targetScaleId", "targetGradeLabel");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE INDEX "StudentProfile_nationalityCountryId_idx" ON "StudentProfile"("nationalityCountryId");

-- CreateIndex
CREATE INDEX "StudentQualification_profileId_idx" ON "StudentQualification"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "QualificationSubjectResult_studentQualificationId_subjectId_key" ON "QualificationSubjectResult"("studentQualificationId", "subjectId", "kind");

-- CreateIndex
CREATE INDEX "LanguageQualification_profileId_testCode_idx" ON "LanguageQualification"("profileId", "testCode");

-- CreateIndex
CREATE UNIQUE INDEX "University_slug_key" ON "University"("slug");

-- CreateIndex
CREATE INDEX "University_countryId_idx" ON "University"("countryId");

-- CreateIndex
CREATE INDEX "University_name_idx" ON "University"("name");

-- CreateIndex
CREATE INDEX "University_verificationStatus_idx" ON "University"("verificationStatus");

-- CreateIndex
CREATE INDEX "UniversityAlias_name_idx" ON "UniversityAlias"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityAlias_universityId_name_key" ON "UniversityAlias"("universityId", "name");

-- CreateIndex
CREATE INDEX "Campus_universityId_idx" ON "Campus"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "DegreeType_code_key" ON "DegreeType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Programme_slug_key" ON "Programme"("slug");

-- CreateIndex
CREATE INDEX "Programme_universityId_idx" ON "Programme"("universityId");

-- CreateIndex
CREATE INDEX "Programme_degreeLevel_idx" ON "Programme"("degreeLevel");

-- CreateIndex
CREATE INDEX "Programme_verificationStatus_idx" ON "Programme"("verificationStatus");

-- CreateIndex
CREATE INDEX "ProgrammeDeadline_programmeId_idx" ON "ProgrammeDeadline"("programmeId");

-- CreateIndex
CREATE INDEX "ProgrammeDeadline_closesAt_idx" ON "ProgrammeDeadline"("closesAt");

-- CreateIndex
CREATE INDEX "TuitionFee_programmeId_idx" ON "TuitionFee"("programmeId");

-- CreateIndex
CREATE INDEX "AdmissionRequirement_programmeId_idx" ON "AdmissionRequirement"("programmeId");

-- CreateIndex
CREATE INDEX "LanguageRequirement_programmeId_idx" ON "LanguageRequirement"("programmeId");

-- CreateIndex
CREATE INDEX "InstitutionRecognition_universityId_idx" ON "InstitutionRecognition"("universityId");

-- CreateIndex
CREATE INDEX "ProgrammePathway_fromProgrammeId_idx" ON "ProgrammePathway"("fromProgrammeId");

-- CreateIndex
CREATE UNIQUE INDEX "ScholarshipProvider_slug_key" ON "ScholarshipProvider"("slug");

-- CreateIndex
CREATE INDEX "ScholarshipProvider_name_idx" ON "ScholarshipProvider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Scholarship_slug_key" ON "Scholarship"("slug");

-- CreateIndex
CREATE INDEX "Scholarship_providerId_idx" ON "Scholarship"("providerId");

-- CreateIndex
CREATE INDEX "Scholarship_verificationStatus_idx" ON "Scholarship"("verificationStatus");

-- CreateIndex
CREATE INDEX "Scholarship_name_idx" ON "Scholarship"("name");

-- CreateIndex
CREATE INDEX "ScholarshipEligibilityRule_scholarshipId_idx" ON "ScholarshipEligibilityRule"("scholarshipId");

-- CreateIndex
CREATE UNIQUE INDEX "ScholarshipFundingComponent_scholarshipId_component_key" ON "ScholarshipFundingComponent"("scholarshipId", "component");

-- CreateIndex
CREATE INDEX "ScholarshipDeadline_scholarshipId_idx" ON "ScholarshipDeadline"("scholarshipId");

-- CreateIndex
CREATE INDEX "ScholarshipDeadline_closesAt_idx" ON "ScholarshipDeadline"("closesAt");

-- CreateIndex
CREATE INDEX "ScholarshipDocumentRequirement_scholarshipId_idx" ON "ScholarshipDocumentRequirement"("scholarshipId");

-- CreateIndex
CREATE INDEX "ScholarshipApplicationMethod_scholarshipId_idx" ON "ScholarshipApplicationMethod"("scholarshipId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchingRuleVersion_version_key" ON "MatchingRuleVersion"("version");

-- CreateIndex
CREATE INDEX "MatchResult_profileId_generatedAt_idx" ON "MatchResult"("profileId", "generatedAt");

-- CreateIndex
CREATE INDEX "MatchResult_programmeId_idx" ON "MatchResult"("programmeId");

-- CreateIndex
CREATE INDEX "MatchResult_scholarshipId_idx" ON "MatchResult"("scholarshipId");

-- CreateIndex
CREATE INDEX "MatchRequirementResult_matchResultId_idx" ON "MatchRequirementResult"("matchResultId");

-- CreateIndex
CREATE INDEX "StudentApplication_profileId_status_idx" ON "StudentApplication"("profileId", "status");

-- CreateIndex
CREATE INDEX "StudentApplication_deadline_idx" ON "StudentApplication"("deadline");

-- CreateIndex
CREATE INDEX "ApplicationTask_applicationId_idx" ON "ApplicationTask"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationDocument_applicationId_idx" ON "ApplicationDocument"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationNote_applicationId_idx" ON "ApplicationNote"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationStatusHistory_applicationId_changedAt_idx" ON "ApplicationStatusHistory"("applicationId", "changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SavedOpportunity_profileId_targetKey_key" ON "SavedOpportunity"("profileId", "targetKey");

-- CreateIndex
CREATE UNIQUE INDEX "DataSource_code_key" ON "DataSource"("code");

-- CreateIndex
CREATE INDEX "DataSource_category_idx" ON "DataSource"("category");

-- CreateIndex
CREATE INDEX "IngestionRun_dataSourceId_startedAt_idx" ON "IngestionRun"("dataSourceId", "startedAt");

-- CreateIndex
CREATE INDEX "IngestionRun_status_idx" ON "IngestionRun"("status");

-- CreateIndex
CREATE INDEX "SourceRecord_entityType_entityId_idx" ON "SourceRecord"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "SourceRecord_dataSourceId_externalId_key" ON "SourceRecord"("dataSourceId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "DataVersion_entityType_entityId_version_key" ON "DataVersion"("entityType", "entityId", "version");

-- CreateIndex
CREATE INDEX "ChangeLog_entityType_entityId_changedAt_idx" ON "ChangeLog"("entityType", "entityId", "changedAt");

-- CreateIndex
CREATE INDEX "ChangeLog_reviewStatus_idx" ON "ChangeLog"("reviewStatus");

-- CreateIndex
CREATE INDEX "VerificationRecord_entityType_entityId_checkedAt_idx" ON "VerificationRecord"("entityType", "entityId", "checkedAt");

-- CreateIndex
CREATE INDEX "ReviewQueueItem_status_priority_idx" ON "ReviewQueueItem"("status", "priority");

-- CreateIndex
CREATE INDEX "ReviewQueueItem_entityType_entityId_idx" ON "ReviewQueueItem"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "VisaCategory_countryId_code_key" ON "VisaCategory"("countryId", "code");

-- CreateIndex
CREATE INDEX "VisaRequirement_visaCategoryId_idx" ON "VisaRequirement"("visaCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Currency_code_key" ON "Currency"("code");

-- CreateIndex
CREATE INDEX "ExchangeRate_rateDate_idx" ON "ExchangeRate"("rateDate");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_baseCurrencyId_quoteCurrencyId_rateDate_source_key" ON "ExchangeRate"("baseCurrencyId", "quoteCurrencyId", "rateDate", "sourceName");

-- CreateIndex
CREATE INDEX "CostEstimate_countryId_category_idx" ON "CostEstimate"("countryId", "category");

-- CreateIndex
CREATE INDEX "BudgetPlan_profileId_idx" ON "BudgetPlan"("profileId");

-- CreateIndex
CREATE INDEX "BudgetItem_budgetPlanId_idx" ON "BudgetItem"("budgetPlanId");

-- CreateIndex
CREATE INDEX "AIConversation_profileId_updatedAt_idx" ON "AIConversation"("profileId", "updatedAt");

-- CreateIndex
CREATE INDEX "AIMessage_conversationId_createdAt_idx" ON "AIMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "AIUsageRecord_profileId_createdAt_idx" ON "AIUsageRecord"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_dedupeKey_key" ON "Notification"("userId", "dedupeKey");

-- CreateIndex
CREATE INDEX "NotificationDelivery_notificationId_idx" ON "NotificationDelivery"("notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfiguration_key_key" ON "SystemConfiguration"("key");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualificationType" ADD CONSTRAINT "QualificationType_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualificationType" ADD CONSTRAINT "QualificationType_defaultGradeScaleId_fkey" FOREIGN KEY ("defaultGradeScaleId") REFERENCES "GradeScale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardingBody" ADD CONSTRAINT "AwardingBody_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualificationAwardingBody" ADD CONSTRAINT "QualificationAwardingBody_qualificationTypeId_fkey" FOREIGN KEY ("qualificationTypeId") REFERENCES "QualificationType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualificationAwardingBody" ADD CONSTRAINT "QualificationAwardingBody_awardingBodyId_fkey" FOREIGN KEY ("awardingBodyId") REFERENCES "AwardingBody"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeBand" ADD CONSTRAINT "GradeBand_gradeScaleId_fkey" FOREIGN KEY ("gradeScaleId") REFERENCES "GradeScale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualificationEquivalence" ADD CONSTRAINT "QualificationEquivalence_sourceScaleId_fkey" FOREIGN KEY ("sourceScaleId") REFERENCES "GradeScale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualificationEquivalence" ADD CONSTRAINT "QualificationEquivalence_targetScaleId_fkey" FOREIGN KEY ("targetScaleId") REFERENCES "GradeScale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_countryOfResidenceId_fkey" FOREIGN KEY ("countryOfResidenceId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_nationalityCountryId_fkey" FOREIGN KEY ("nationalityCountryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_intendedSubjectId_fkey" FOREIGN KEY ("intendedSubjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPreferredDestination" ADD CONSTRAINT "StudentPreferredDestination_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPreferredDestination" ADD CONSTRAINT "StudentPreferredDestination_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentQualification" ADD CONSTRAINT "StudentQualification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentQualification" ADD CONSTRAINT "StudentQualification_qualificationTypeId_fkey" FOREIGN KEY ("qualificationTypeId") REFERENCES "QualificationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentQualification" ADD CONSTRAINT "StudentQualification_awardingBodyId_fkey" FOREIGN KEY ("awardingBodyId") REFERENCES "AwardingBody"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentQualification" ADD CONSTRAINT "StudentQualification_gradeScaleId_fkey" FOREIGN KEY ("gradeScaleId") REFERENCES "GradeScale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualificationSubjectResult" ADD CONSTRAINT "QualificationSubjectResult_studentQualificationId_fkey" FOREIGN KEY ("studentQualificationId") REFERENCES "StudentQualification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualificationSubjectResult" ADD CONSTRAINT "QualificationSubjectResult_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LanguageQualification" ADD CONSTRAINT "LanguageQualification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "University" ADD CONSTRAINT "University_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityAlias" ADD CONSTRAINT "UniversityAlias_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campus" ADD CONSTRAINT "Campus_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campus" ADD CONSTRAINT "Campus_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Programme" ADD CONSTRAINT "Programme_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Programme" ADD CONSTRAINT "Programme_degreeTypeId_fkey" FOREIGN KEY ("degreeTypeId") REFERENCES "DegreeType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammeSubject" ADD CONSTRAINT "ProgrammeSubject_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammeSubject" ADD CONSTRAINT "ProgrammeSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammeDeadline" ADD CONSTRAINT "ProgrammeDeadline_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TuitionFee" ADD CONSTRAINT "TuitionFee_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionRequirement" ADD CONSTRAINT "AdmissionRequirement_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionRequirement" ADD CONSTRAINT "AdmissionRequirement_qualificationTypeId_fkey" FOREIGN KEY ("qualificationTypeId") REFERENCES "QualificationType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionRequirement" ADD CONSTRAINT "AdmissionRequirement_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionRequirement" ADD CONSTRAINT "AdmissionRequirement_gradeScaleId_fkey" FOREIGN KEY ("gradeScaleId") REFERENCES "GradeScale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LanguageRequirement" ADD CONSTRAINT "LanguageRequirement_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionRecognition" ADD CONSTRAINT "InstitutionRecognition_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionRecognition" ADD CONSTRAINT "InstitutionRecognition_authorityCountryId_fkey" FOREIGN KEY ("authorityCountryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammePathway" ADD CONSTRAINT "ProgrammePathway_fromProgrammeId_fkey" FOREIGN KEY ("fromProgrammeId") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipProvider" ADD CONSTRAINT "ScholarshipProvider_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scholarship" ADD CONSTRAINT "Scholarship_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ScholarshipProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scholarship" ADD CONSTRAINT "Scholarship_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scholarship" ADD CONSTRAINT "Scholarship_hostCountryId_fkey" FOREIGN KEY ("hostCountryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipEligibilityRule" ADD CONSTRAINT "ScholarshipEligibilityRule_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipFundingComponent" ADD CONSTRAINT "ScholarshipFundingComponent_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipDeadline" ADD CONSTRAINT "ScholarshipDeadline_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipDocumentRequirement" ADD CONSTRAINT "ScholarshipDocumentRequirement_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipApplicationMethod" ADD CONSTRAINT "ScholarshipApplicationMethod_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchingRuleVersion" ADD CONSTRAINT "MatchingRuleVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_ruleVersionId_fkey" FOREIGN KEY ("ruleVersionId") REFERENCES "MatchingRuleVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchRequirementResult" ADD CONSTRAINT "MatchRequirementResult_matchResultId_fkey" FOREIGN KEY ("matchResultId") REFERENCES "MatchResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentApplication" ADD CONSTRAINT "StudentApplication_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentApplication" ADD CONSTRAINT "StudentApplication_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentApplication" ADD CONSTRAINT "StudentApplication_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationTask" ADD CONSTRAINT "ApplicationTask_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "StudentApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "StudentApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationNote" ADD CONSTRAINT "ApplicationNote_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "StudentApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "StudentApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedOpportunity" ADD CONSTRAINT "SavedOpportunity_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedOpportunity" ADD CONSTRAINT "SavedOpportunity_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedOpportunity" ADD CONSTRAINT "SavedOpportunity_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedOpportunity" ADD CONSTRAINT "SavedOpportunity_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionJob" ADD CONSTRAINT "IngestionJob_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionRun" ADD CONSTRAINT "IngestionRun_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "IngestionJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionRun" ADD CONSTRAINT "IngestionRun_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceRecord" ADD CONSTRAINT "SourceRecord_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataVersion" ADD CONSTRAINT "DataVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeLog" ADD CONSTRAINT "ChangeLog_sourceRecordId_fkey" FOREIGN KEY ("sourceRecordId") REFERENCES "SourceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeLog" ADD CONSTRAINT "ChangeLog_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRecord" ADD CONSTRAINT "VerificationRecord_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewQueueItem" ADD CONSTRAINT "ReviewQueueItem_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaCategory" ADD CONSTRAINT "VisaCategory_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaRequirement" ADD CONSTRAINT "VisaRequirement_visaCategoryId_fkey" FOREIGN KEY ("visaCategoryId") REFERENCES "VisaCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaSource" ADD CONSTRAINT "VisaSource_visaCategoryId_fkey" FOREIGN KEY ("visaCategoryId") REFERENCES "VisaCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_baseCurrencyId_fkey" FOREIGN KEY ("baseCurrencyId") REFERENCES "Currency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_quoteCurrencyId_fkey" FOREIGN KEY ("quoteCurrencyId") REFERENCES "Currency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostEstimate" ADD CONSTRAINT "CostEstimate_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetPlan" ADD CONSTRAINT "BudgetPlan_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetPlan" ADD CONSTRAINT "BudgetPlan_targetProgrammeId_fkey" FOREIGN KEY ("targetProgrammeId") REFERENCES "Programme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_budgetPlanId_fkey" FOREIGN KEY ("budgetPlanId") REFERENCES "BudgetPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsageRecord" ADD CONSTRAINT "AIUsageRecord_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
