import { db } from "@edubuf/database";
import { evaluateOpportunity } from "@edubuf/matching";
import type {
  MatchEvaluation,
  OpportunityRequirement,
  OpportunitySnapshot,
  StudentSnapshot,
} from "@edubuf/matching";

export async function loadStudentSnapshot(profileId: string): Promise<StudentSnapshot | null> {
  const profile = await db.studentProfile.findUnique({
    where: { id: profileId },
    include: {
      nationality: true,
      countryOfResidence: true,
      qualifications: {
        include: {
          qualificationType: true,
          gradeScale: true,
          subjectResults: { include: { subject: true } },
        },
      },
      languageQualifications: true,
    },
  });

  if (!profile) return null;

  return {
    nationalityCountryCode: profile.nationality?.iso2 ?? null,
    residenceCountryCode: profile.countryOfResidence?.iso2 ?? null,
    dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : null,
    intendedDegreeLevel: profile.intendedDegreeLevel ?? null,
    financialNeedLevel: profile.financialNeedLevel ?? null,
    languageTests: profile.languageQualifications.map((test) => ({
      testCode: test.testCode,
      score: test.score,
      expiresAt: test.expiresAt ? test.expiresAt.toISOString() : null,
    })),
    qualifications: profile.qualifications.map((qualification) => ({
      qualificationTypeCode: qualification.qualificationType.code,
      level: qualification.qualificationType.level,
      status: qualification.status,
      gradeScaleCode: qualification.gradeScale?.code ?? null,
      overallGradeLabel: qualification.overallGradeLabel,
      overallGradeRank: qualification.overallGradeRank,
      results: qualification.subjectResults.map((result) => ({
        subjectCode: result.subject.code,
        subjectName: result.subject.name,
        gradeLabel: result.gradeLabel,
        gradeRank: result.gradeRank,
        kind: result.kind,
      })),
    })),
  };
}

type ProgrammeWithRequirements = NonNullable<
  Awaited<ReturnType<typeof loadProgrammeForMatching>>
>;

export async function loadProgrammeForMatching(programmeId: string) {
  return db.programme.findUnique({
    where: { id: programmeId },
    include: {
      university: true,
      admissionRequirements: {
        include: { qualificationType: true, subject: true, gradeScale: true },
      },
      languageRequirements: true,
    },
  });
}

export async function loadScholarshipForMatching(scholarshipId: string) {
  return db.scholarship.findUnique({
    where: { id: scholarshipId },
    include: { provider: true, eligibilityRules: true, fundingComponents: true },
  });
}

export function programmeSnapshot(programme: ProgrammeWithRequirements): OpportunitySnapshot {
  const requirements: OpportunityRequirement[] = programme.admissionRequirements.map((rule) => ({
    key: rule.id,
    label: rule.label,
    kind: rule.kind,
    isMandatory: rule.isMandatory,
    sourceUrl: rule.sourceUrl,
    verificationStatus: rule.verificationStatus,
    lastCheckedAt: rule.lastCheckedAt ? rule.lastCheckedAt.toISOString() : null,
    qualificationTypeCodes: rule.qualificationType ? [rule.qualificationType.code] : undefined,
    requiredLevel: rule.qualificationType?.level ?? null,
    subjectCodes: rule.subject ? [rule.subject.code] : undefined,
    minimumGradeLabel: rule.minimumGradeLabel,
    minimumGradeRank: rule.minimumGradeRank,
    gradeScaleCode: rule.gradeScale?.code ?? null,
  }));

  for (const language of programme.languageRequirements) {
    requirements.push({
      key: `lang-${language.id}`,
      label: `${language.testCode} ${language.minimumScore}${language.scaleNote ? ` (${language.scaleNote})` : ""}`,
      kind: "LANGUAGE",
      isMandatory: language.isMandatory,
      sourceUrl: language.sourceUrl,
      verificationStatus: language.verificationStatus,
      lastCheckedAt: language.lastCheckedAt ? language.lastCheckedAt.toISOString() : null,
      languageTestCode: language.testCode,
      minimumScore: language.minimumScore,
    });
  }

  return {
    kind: "PROGRAMME",
    id: programme.id,
    title: programme.title,
    verificationStatus: programme.verificationStatus,
    officialUrl: programme.officialUrl,
    requirements,
  };
}

interface ScholarshipRules {
  id: string;
  name: string;
  officialUrl: string;
  verificationStatus: OpportunitySnapshot["verificationStatus"];
  eligibilityRules: Array<{
    id: string;
    kind: OpportunityRequirement["kind"];
    label: string;
    valueString: string | null;
    minValue: number | null;
    isMandatory: boolean;
    sourceUrl: string | null;
    verificationStatus: OpportunitySnapshot["verificationStatus"];
    lastCheckedAt: Date | null;
  }>;
}

export function scholarshipSnapshot(scholarship: ScholarshipRules): OpportunitySnapshot {
  return {
    kind: "SCHOLARSHIP",
    id: scholarship.id,
    title: scholarship.name,
    verificationStatus: scholarship.verificationStatus,
    officialUrl: scholarship.officialUrl,
    requirements: scholarship.eligibilityRules.map((rule) => {
      const codes = rule.valueString
        ? rule.valueString
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
        : null;

      return {
        key: rule.id,
        label: rule.label,
        kind: rule.kind,
        isMandatory: rule.isMandatory,
        sourceUrl: rule.sourceUrl,
        verificationStatus: rule.verificationStatus,
        lastCheckedAt: rule.lastCheckedAt ? rule.lastCheckedAt.toISOString() : null,
        nationalityCodes: rule.kind === "NATIONALITY" ? codes : undefined,
        residencyCodes: rule.kind === "RESIDENCY" ? codes : undefined,
        valueString: rule.valueString,
        minimumGradeRank:
          rule.kind === "GRADE" && rule.minValue !== null ? Math.round(rule.minValue) : null,
      };
    }),
  };
}

export async function evaluateProgrammeForProfile(
  profileId: string,
  programmeId: string,
): Promise<MatchEvaluation | null> {
  const [snapshot, programme] = await Promise.all([
    loadStudentSnapshot(profileId),
    loadProgrammeForMatching(programmeId),
  ]);
  if (!snapshot || !programme) return null;
  return evaluateOpportunity(programmeSnapshot(programme), snapshot);
}

export async function evaluateScholarshipForProfile(
  profileId: string,
  scholarshipId: string,
): Promise<MatchEvaluation | null> {
  const [snapshot, scholarship] = await Promise.all([
    loadStudentSnapshot(profileId),
    loadScholarshipForMatching(scholarshipId),
  ]);
  if (!snapshot || !scholarship) return null;
  return evaluateOpportunity(scholarshipSnapshot(scholarship), snapshot);
}
