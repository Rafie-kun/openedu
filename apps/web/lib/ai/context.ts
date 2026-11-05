import { db } from "@openedu/database";
import { evaluateOpportunity } from "@openedu/matching";
import { loadStudentSnapshot, programmeSnapshot, scholarshipSnapshot } from "@/lib/eligibility";
import type { AssistantCitation } from "./types";

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "what",
  "which",
  "how",
  "can",
  "does",
  "about",
  "from",
  "that",
  "this",
  "are",
  "you",
  "your",
  "have",
  "need",
  "want",
  "should",
  "could",
  "would",
  "into",
  "there",
  "their",
  "them",
  "than",
  "then",
  "when",
  "where",
  "who",
  "why",
  "tell",
  "give",
  "show",
  "find",
  "help",
]);

function keywordsFrom(question: string): string[] {
  const words = question
    .toLowerCase()
    .match(/[a-z0-9]{3,}/g)
    ?.filter((word) => !STOPWORDS.has(word));

  return [...new Set(words ?? [])].slice(0, 6);
}

function searchClause(keywords: string[]) {
  return keywords.flatMap((keyword) => [
    { name: { contains: keyword, mode: "insensitive" as const } },
    { city: { contains: keyword, mode: "insensitive" as const } },
  ]);
}

function titleClause(keywords: string[]) {
  return keywords.map((keyword) => ({
    title: { contains: keyword, mode: "insensitive" as const },
  }));
}

function nameClause(keywords: string[]) {
  return keywords.map((keyword) => ({
    name: { contains: keyword, mode: "insensitive" as const },
  }));
}

function joinList(values: string[]): string {
  return values.filter(Boolean).join("; ");
}

export interface RetrievedContext {
  text: string;
  citations: AssistantCitation[];
}

export async function retrieveContext(
  question: string,
  profileId: string,
  includeProfile: boolean,
): Promise<RetrievedContext> {
  const keywords = keywordsFrom(question);
  const hasKeywords = keywords.length > 0;

  const [universities, programmes, scholarships] = await Promise.all([
    db.university.findMany({
      where: hasKeywords
        ? { verificationStatus: { not: "ARCHIVED" }, OR: searchClause(keywords) }
        : { verificationStatus: "VERIFIED" },
      include: { country: { select: { name: true, iso2: true } } },
      orderBy: { name: "asc" },
      take: 4,
    }),
    db.programme.findMany({
      where: hasKeywords
        ? { verificationStatus: { not: "ARCHIVED" }, OR: titleClause(keywords) }
        : { verificationStatus: "VERIFIED" },
      include: {
        university: true,
        admissionRequirements: {
          include: { qualificationType: true, subject: true, gradeScale: true },
          orderBy: [{ isMandatory: "desc" }, { label: "asc" }],
          take: 8,
        },
        languageRequirements: { orderBy: { testCode: "asc" }, take: 4 },
        deadlines: { orderBy: { closesAt: "asc" }, take: 4 },
      },
      orderBy: { title: "asc" },
      take: 3,
    }),
    db.scholarship.findMany({
      where: hasKeywords
        ? { verificationStatus: { not: "ARCHIVED" }, OR: nameClause(keywords) }
        : { verificationStatus: "VERIFIED" },
      include: {
        provider: { select: { name: true } },
        eligibilityRules: { orderBy: [{ isMandatory: "desc" }, { label: "asc" }], take: 8 },
        fundingComponents: true,
        deadlines: { orderBy: { closesAt: "asc" }, take: 4 },
      },
      orderBy: { name: "asc" },
      take: 3,
    }),
  ]);

  const citations: AssistantCitation[] = [];
  const lines: string[] = [];

  function addCitation(citation: Omit<AssistantCitation, "index">): number {
    const index = citations.length + 1;
    citations.push({ ...citation, index });
    return index;
  }

  for (const university of universities) {
    const index = addCitation({
      kind: "UNIVERSITY",
      id: university.id,
      title: university.name,
      url: university.websiteUrl ?? university.sourceUrl,
      verificationStatus: university.verificationStatus,
      lastCheckedAt: university.lastCheckedAt?.toISOString() ?? null,
    });

    lines.push(
      `[${index}] UNIVERSITY — ${university.name} — ${university.city ?? "city not recorded"}, ${university.country.name} (${university.country.iso2}) — verification: ${university.verificationStatus} — official: ${university.websiteUrl ?? "not recorded"}`,
    );
  }

  let student = null;
  if (includeProfile) {
    student = await loadStudentSnapshot(profileId);
  }

  for (const programme of programmes) {
    const index = addCitation({
      kind: "PROGRAMME",
      id: programme.id,
      title: programme.title,
      url: programme.officialUrl,
      verificationStatus: programme.verificationStatus,
      lastCheckedAt: programme.lastCheckedAt?.toISOString() ?? null,
    });

    const requirements = programme.admissionRequirements.map((rule) => rule.label);
    const languages = programme.languageRequirements.map(
      (rule) => `${rule.testCode} ${rule.minimumScore}`,
    );
    const deadlines = programme.deadlines
      .filter((deadline) => deadline.closesAt)
      .map(
        (deadline) => `${deadline.label}: closes ${deadline.closesAt!.toISOString().slice(0, 10)}`,
      );

    let evaluation = "";
    if (student) {
      const result = evaluateOpportunity(programmeSnapshot(programme), student);
      evaluation = ` — platform comparison: ${result.outcome} (${result.summary})`;
    }

    lines.push(
      `[${index}] PROGRAMME — ${programme.title} at ${programme.university.name} — level: ${programme.degreeLevel} — verification: ${programme.verificationStatus} — official: ${programme.officialUrl ?? "not recorded"} — requirements: ${joinList([...requirements, ...languages]) || "none recorded"} — deadlines: ${joinList(deadlines) || "none recorded"}${evaluation}`,
    );
  }

  for (const scholarship of scholarships) {
    const index = addCitation({
      kind: "SCHOLARSHIP",
      id: scholarship.id,
      title: scholarship.name,
      url: scholarship.officialUrl,
      verificationStatus: scholarship.verificationStatus,
      lastCheckedAt: scholarship.lastCheckedAt?.toISOString() ?? null,
    });

    const rules = scholarship.eligibilityRules.map((rule) => rule.label);
    const funding = scholarship.fundingComponents.map(
      (component) =>
        `${component.component.toLowerCase().replaceAll("_", " ")}: ${component.coverage.toLowerCase().replaceAll("_", " ")}`,
    );
    const deadlines = scholarship.deadlines
      .filter((deadline) => deadline.closesAt)
      .map(
        (deadline) => `${deadline.label}: closes ${deadline.closesAt!.toISOString().slice(0, 10)}`,
      );

    let evaluation = "";
    if (student) {
      const result = evaluateOpportunity(scholarshipSnapshot(scholarship), student);
      evaluation = ` — platform comparison: ${result.outcome} (${result.summary})`;
    }

    lines.push(
      `[${index}] SCHOLARSHIP — ${scholarship.name} by ${scholarship.provider.name} — verification: ${scholarship.verificationStatus} — official: ${scholarship.officialUrl} — eligibility rules: ${joinList(rules) || "none recorded"} — funding: ${joinList(funding) || "not specified"} — deadlines: ${joinList(deadlines) || "none recorded"}${evaluation}`,
    );
  }

  if (student) {
    const qualifications = student.qualifications.map((qualification) => {
      const results = qualification.results
        .map(
          (result) => `${result.subjectName} ${result.gradeLabel} (${result.kind.toLowerCase()})`,
        )
        .join(", ");
      return `${qualification.qualificationTypeCode} (${qualification.status.toLowerCase()})${results ? `: ${results}` : ""}`;
    });
    const languages = student.languageTests.map((test) => `${test.testCode} ${test.score}`);

    lines.push(
      `STUDENT CONTEXT (private, supplied with consent for this message) — nationality: ${student.nationalityCountryCode ?? "not recorded"} — residence: ${student.residenceCountryCode ?? "not recorded"} — intended level: ${student.intendedDegreeLevel ?? "not recorded"} — financial need: ${student.financialNeedLevel ?? "not recorded"} — qualifications: ${joinList(qualifications) || "none recorded"} — language tests: ${joinList(languages) || "none recorded"}`,
    );
  }

  return {
    text: lines.join("\n"),
    citations,
  };
}
