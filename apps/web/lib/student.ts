import { db } from "@openedu/database";

export async function getOrCreateProfile(userId: string) {
  return db.studentProfile.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: {
      preferredDestinations: { orderBy: { priority: "asc" } },
      nationality: true,
      countryOfResidence: true,
    },
  });
}

export async function listCountries() {
  return db.country.findMany({
    orderBy: { name: "asc" },
    select: { id: true, iso2: true, iso3: true, name: true },
  });
}

export async function listSubjects() {
  return db.subject.findMany({
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true },
  });
}

export async function loadQualifications(profileId: string) {
  return db.studentQualification.findMany({
    where: { profileId },
    include: {
      qualificationType: true,
      awardingBody: true,
      gradeScale: true,
      subjectResults: { include: { subject: true }, orderBy: { subject: { name: "asc" } } },
    },
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function loadLanguageTests(profileId: string) {
  return db.languageQualification.findMany({
    where: { profileId },
    orderBy: { createdAt: "desc" },
  });
}

export async function loadQualificationOptions() {
  const types = await db.qualificationType.findMany({
    orderBy: [{ level: "asc" }, { name: "asc" }],
    include: {
      defaultGradeScale: { include: { bands: { orderBy: { rank: "desc" } } } },
      awardingBodies: { select: { awardingBodyId: true } },
    },
  });

  const awardingBodies = await db.awardingBody.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return {
    types: types.map((type) => ({
      id: type.id,
      name: type.name,
      level: type.level,
      scaleId: type.defaultGradeScale?.id ?? null,
      scaleName: type.defaultGradeScale?.name ?? null,
      bands: (type.defaultGradeScale?.bands ?? []).map((band) => ({
        label: band.label,
        rank: band.rank,
      })),
      awardingBodyIds: type.awardingBodies.map((body) => body.awardingBodyId),
    })),
    awardingBodies,
  };
}
