-- Field-level provenance for ScholarshipFundingComponent, matching every other child record type.
ALTER TABLE "ScholarshipFundingComponent" ADD COLUMN "sourceUrl" TEXT;
ALTER TABLE "ScholarshipFundingComponent" ADD COLUMN "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED';
ALTER TABLE "ScholarshipFundingComponent" ADD COLUMN "lastCheckedAt" TIMESTAMP(3);
ALTER TABLE "ScholarshipFundingComponent" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
