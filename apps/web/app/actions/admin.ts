"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@openedu/database";
import {
  adminVerificationSchema,
  admissionRequirementEditSchema,
  admissionRequirementSchema,
  candidatePromotionSchema,
  languageRequirementEditSchema,
  languageRequirementSchema,
  programmeCreateSchema,
  programmeDeadlineEditSchema,
  programmeDeadlineSchema,
  programmeEditSchema,
  reviewDecisionSchema,
  scholarshipCreateSchema,
  scholarshipDeadlineEditSchema,
  scholarshipDeadlineSchema,
  scholarshipEditSchema,
  scholarshipEligibilityRuleEditSchema,
  scholarshipEligibilityRuleSchema,
  scholarshipFundingComponentEditSchema,
  scholarshipFundingComponentSchema,
  scholarshipProviderEditSchema,
  tuitionFeeEditSchema,
  tuitionFeeSchema,
  universityEditSchema,
} from "@openedu/validation";
import { audit } from "@/lib/audit";
import { draftFromPayload, slugify, uniqueSlug } from "@/lib/candidates";
import { fieldErrorsFrom, readAll, readString, type FormState } from "@/lib/forms";
import { requireAdmin } from "@/lib/session";

function diffField(
  field: string,
  oldValue: unknown,
  newValue: unknown,
): { field: string; oldValue: string | null; newValue: string | null } | null {
  const o = oldValue === null || oldValue === undefined ? null : String(oldValue);
  const n = newValue === null || newValue === undefined ? null : String(newValue);
  return o === n ? null : { field, oldValue: o, newValue: n };
}

async function recordFieldChanges(
  entityType: string,
  entityId: string,
  changes: Array<{ field: string; oldValue: string | null; newValue: string | null }>,
) {
  if (changes.length === 0) return;
  await db.changeLog.createMany({
    data: changes.map((change) => ({
      entityType,
      entityId,
      field: change.field,
      oldValue: change.oldValue,
      newValue: change.newValue,
    })),
  });
}

async function openReviewItem(reviewId: string) {
  return db.reviewQueueItem.findFirst({
    where: { id: reviewId, status: { in: ["OPEN", "IN_REVIEW"] } },
  });
}

export async function resolveReviewAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = reviewDecisionSchema.safeParse({
    reviewId: readString(formData, "reviewId"),
    note: readString(formData, "note") || undefined,
  });
  if (!parsed.success) {
    return {
      error: "That review item could not be read.",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }

  const item = await openReviewItem(parsed.data.reviewId);
  if (!item) return { error: "This item is no longer open." };

  await db.reviewQueueItem.update({
    where: { id: item.id },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
      resolutionNote: parsed.data.note ?? null,
      assignedToId: admin.id,
    },
  });

  await audit({
    actorId: admin.id,
    action: "admin.review_resolved",
    entityType: item.entityType,
    entityId: item.entityId,
    metadata: { reviewId: item.id, reason: item.reason },
  });

  revalidatePath("/admin/review");
  revalidatePath(`/admin/review/${item.id}`);
  return { success: "Marked as resolved." };
}

export async function rejectReviewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = reviewDecisionSchema.safeParse({
    reviewId: readString(formData, "reviewId"),
    note: readString(formData, "note") || undefined,
  });
  if (!parsed.success) {
    return {
      error: "That review item could not be read.",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }

  const item = await openReviewItem(parsed.data.reviewId);
  if (!item) return { error: "This item is no longer open." };

  await db.reviewQueueItem.update({
    where: { id: item.id },
    data: {
      status: "REJECTED",
      resolvedAt: new Date(),
      resolutionNote: parsed.data.note ?? null,
      assignedToId: admin.id,
    },
  });

  await audit({
    actorId: admin.id,
    action: "admin.review_rejected",
    entityType: item.entityType,
    entityId: item.entityId,
    metadata: { reviewId: item.id, reason: item.reason },
  });

  revalidatePath("/admin/review");
  revalidatePath(`/admin/review/${item.id}`);
  return { success: "Rejected. The source record stays for history." };
}

export async function setSourceActiveAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const sourceId = readString(formData, "sourceId");
  const isActive = readString(formData, "isActive") === "true";
  if (!sourceId) return;

  const source = await db.dataSource.findUnique({
    where: { id: sourceId },
    select: { id: true, code: true, isActive: true },
  });
  if (!source) return;

  await db.dataSource.update({ where: { id: source.id }, data: { isActive } });
  await audit({
    actorId: admin.id,
    action: isActive ? "admin.source_enabled" : "admin.source_disabled",
    entityType: "DataSource",
    entityId: source.id,
    metadata: { code: source.code, previous: source.isActive },
  });

  revalidatePath("/admin/sources");
  revalidatePath("/admin");
}

export async function promoteCandidateAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = candidatePromotionSchema.safeParse({
    reviewId: readString(formData, "reviewId"),
    name: readString(formData, "name"),
    city: readString(formData, "city"),
    countryCode: readString(formData, "countryCode"),
    websiteUrl: readString(formData, "websiteUrl"),
    note: readString(formData, "note") || undefined,
  });
  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
      values: {
        name: readString(formData, "name"),
        city: readString(formData, "city"),
        countryCode: readString(formData, "countryCode"),
        websiteUrl: readString(formData, "websiteUrl"),
      },
    };
  }

  const item = await openReviewItem(parsed.data.reviewId);
  if (!item) return { error: "This item is no longer open." };
  if (item.entityType !== "UNIVERSITY_CANDIDATE") {
    return { error: "Only institution candidates can be added to the catalogue from here." };
  }

  const record = await db.sourceRecord.findUnique({ where: { id: item.entityId } });
  if (!record) return { error: "The source record behind this item is gone." };

  const country = await db.country.findUnique({
    where: { iso2: parsed.data.countryCode.toUpperCase() },
    select: { id: true },
  });
  if (!country) {
    return {
      error:
        "That country code is not in the reference table yet. Add the country before the institution.",
      fieldErrors: { countryCode: "Unknown country code" },
    };
  }

  const existing = await db.university.findFirst({
    where: { websiteUrl: parsed.data.websiteUrl },
    select: { slug: true, name: true },
  });
  if (existing) {
    return {
      error: `An institution with this website is already in the catalogue (${existing.name}).`,
      fieldErrors: { websiteUrl: "Already recorded" },
    };
  }

  const base = slugify(parsed.data.name);
  const taken = (
    await db.university.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } })
  ).map((row) => row.slug);
  const slug = uniqueSlug(base, taken);

  const created = await db.university.create({
    data: {
      slug,
      name: parsed.data.name,
      countryId: country.id,
      city: parsed.data.city,
      websiteUrl: parsed.data.websiteUrl,
      type: "OTHER",
      verificationStatus: "UNVERIFIED",
      sourceUrl: record.externalId,
      lastCheckedAt: new Date(),
    },
    select: { id: true, name: true },
  });

  const draft = draftFromPayload(record.payload as Record<string, unknown> | null);
  const note =
    parsed.data.note ||
    `Added from ${record.externalId}. Name, city and website were checked against the source; everything else is still unverified.`;

  await db.reviewQueueItem.update({
    where: { id: item.id },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
      resolutionNote: `${note} University id: ${created.id}.`,
      assignedToId: admin.id,
    },
  });

  await audit({
    actorId: admin.id,
    action: "admin.university_created_from_source",
    entityType: "University",
    entityId: created.id,
    metadata: {
      sourceRecordId: record.id,
      externalId: record.externalId,
      reviewId: item.id,
      sourceName: draft.name,
    },
  });

  revalidatePath("/admin/review");
  revalidatePath("/universities");
  revalidatePath(`/universities/${slug}`);
  return { success: `${created.name} was added as an unverified institution.` };
}

export async function updateUniversityAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = universityEditSchema.safeParse({
    id: readString(formData, "id"),
    name: readString(formData, "name"),
    officialName: readString(formData, "officialName") || undefined,
    countryId: readString(formData, "countryId"),
    city: readString(formData, "city"),
    websiteUrl: readString(formData, "websiteUrl"),
    type: readString(formData, "type"),
    sourceUrl: readString(formData, "sourceUrl") || undefined,
  });
  if (!parsed.success) return invalid(parsed.error.issues);

  const existing = await db.university.findUnique({
    where: { id: parsed.data.id },
    select: {
      slug: true,
      name: true,
      officialName: true,
      countryId: true,
      city: true,
      websiteUrl: true,
      type: true,
      sourceUrl: true,
      verificationStatus: true,
    },
  });
  if (!existing) return { error: "That institution is no longer in the catalogue." };
  if (existing.verificationStatus === "ARCHIVED") {
    return { error: "Archived institutions cannot be edited. Restore it to a review state first." };
  }

  const country = await db.country.findUnique({
    where: { id: parsed.data.countryId },
    select: { id: true },
  });
  if (!country) {
    return {
      error: "That country is not in the reference table.",
      fieldErrors: { countryId: "Pick one from the list" },
    };
  }

  const nextOfficialName = parsed.data.officialName || null;
  const nextSourceUrl = parsed.data.sourceUrl || null;

  const changes = [
    diffField("name", existing.name, parsed.data.name),
    diffField("officialName", existing.officialName, nextOfficialName),
    diffField("countryId", existing.countryId, parsed.data.countryId),
    diffField("city", existing.city, parsed.data.city),
    diffField("websiteUrl", existing.websiteUrl, parsed.data.websiteUrl),
    diffField("type", existing.type, parsed.data.type),
    diffField("sourceUrl", existing.sourceUrl, nextSourceUrl),
  ].filter((change) => change !== null);

  if (changes.length === 0) return { success: "No changes." };

  const nextStatus =
    existing.verificationStatus === "VERIFIED" ? "PENDING_REVIEW" : existing.verificationStatus;

  await db.university.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      officialName: nextOfficialName,
      countryId: parsed.data.countryId,
      city: parsed.data.city,
      websiteUrl: parsed.data.websiteUrl,
      type: parsed.data.type,
      sourceUrl: nextSourceUrl,
      verificationStatus: nextStatus,
      lastCheckedAt: nextStatus === "PENDING_REVIEW" ? null : undefined,
    },
  });

  await recordFieldChanges("University", parsed.data.id, changes);

  await audit({
    actorId: admin.id,
    action: "admin.university_updated",
    entityType: "University",
    entityId: parsed.data.id,
    metadata: { fields: changes.map((change) => change.field) },
  });

  revalidatePath("/admin/catalogue");
  revalidatePath(`/admin/catalogue/university/${parsed.data.id}`);
  revalidatePath("/universities");
  revalidatePath(`/universities/${existing.slug}`);
  return { success: "Institution updated. Verification was reset to pending review." };
}

async function freeProgrammeSlug(base: string): Promise<string> {
  const root = slugify(base) || "programme";
  const taken = await db.programme.findMany({
    where: { slug: { startsWith: root } },
    select: { slug: true },
  });
  return uniqueSlug(
    root,
    taken.map((row) => row.slug),
  );
}

async function freeScholarshipSlug(base: string): Promise<string> {
  const root = slugify(base) || "scholarship";
  const taken = await db.scholarship.findMany({
    where: { slug: { startsWith: root } },
    select: { slug: true },
  });
  return uniqueSlug(
    root,
    taken.map((row) => row.slug),
  );
}

export async function createProgrammeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = programmeCreateSchema.safeParse({
    universityId: readString(formData, "universityId"),
    title: readString(formData, "title"),
    degreeLevel: readString(formData, "degreeLevel"),
    durationMonths: readString(formData, "durationMonths") || undefined,
    officialUrl: readString(formData, "officialUrl"),
    sourceUrl: readString(formData, "sourceUrl"),
    tuitionSummary: readString(formData, "tuitionSummary") || undefined,
  });
  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }

  const university = await db.university.findUnique({
    where: { id: parsed.data.universityId },
    select: { id: true, name: true },
  });
  if (!university) {
    return {
      error: "That institution is not in the catalogue.",
      fieldErrors: { universityId: "Pick one from the list" },
    };
  }

  const duplicate = await db.programme.findFirst({
    where: { universityId: university.id, officialUrl: parsed.data.officialUrl },
    select: { slug: true },
  });
  if (duplicate) {
    return {
      error: "This programme page is already recorded for that institution.",
      fieldErrors: { officialUrl: "Already recorded" },
    };
  }

  const slug = await freeProgrammeSlug(`${university.name} ${parsed.data.title}`);

  const created = await db.programme.create({
    data: {
      slug,
      universityId: university.id,
      title: parsed.data.title,
      degreeLevel: parsed.data.degreeLevel,
      durationMonths: parsed.data.durationMonths ?? null,
      officialUrl: parsed.data.officialUrl,
      sourceUrl: parsed.data.sourceUrl,
      tuitionSummary: parsed.data.tuitionSummary ?? null,
      verificationStatus: "PENDING_REVIEW",
    },
    select: { id: true, slug: true, title: true },
  });

  await audit({
    actorId: admin.id,
    action: "admin.programme_created",
    entityType: "Programme",
    entityId: created.id,
    metadata: { universityId: university.id, sourceUrl: parsed.data.sourceUrl },
  });

  revalidatePath("/admin/catalogue");
  revalidatePath("/programmes");
  redirect(`/programmes/${created.slug}`);
}

export async function updateProgrammeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = programmeEditSchema.safeParse({
    id: readString(formData, "id"),
    universityId: readString(formData, "universityId"),
    title: readString(formData, "title"),
    degreeLevel: readString(formData, "degreeLevel"),
    durationMonths: readString(formData, "durationMonths") || undefined,
    officialUrl: readString(formData, "officialUrl"),
    sourceUrl: readString(formData, "sourceUrl"),
    tuitionSummary: readString(formData, "tuitionSummary") || undefined,
  });
  if (!parsed.success) return invalid(parsed.error.issues);

  const existing = await db.programme.findUnique({
    where: { id: parsed.data.id },
    select: {
      slug: true,
      universityId: true,
      title: true,
      degreeLevel: true,
      durationMonths: true,
      officialUrl: true,
      sourceUrl: true,
      tuitionSummary: true,
      verificationStatus: true,
    },
  });
  if (!existing) return { error: "That programme is no longer in the catalogue." };
  if (existing.verificationStatus === "ARCHIVED") {
    return { error: "Archived programmes cannot be edited. Restore it to a review state first." };
  }

  const university = await db.university.findUnique({
    where: { id: parsed.data.universityId },
    select: { id: true },
  });
  if (!university) {
    return {
      error: "That institution is not in the catalogue.",
      fieldErrors: { universityId: "Pick one from the list" },
    };
  }

  const nextDurationMonths = parsed.data.durationMonths ?? null;
  const nextTuitionSummary = parsed.data.tuitionSummary || null;

  const changes = [
    diffField("universityId", existing.universityId, parsed.data.universityId),
    diffField("title", existing.title, parsed.data.title),
    diffField("degreeLevel", existing.degreeLevel, parsed.data.degreeLevel),
    diffField("durationMonths", existing.durationMonths, nextDurationMonths),
    diffField("officialUrl", existing.officialUrl, parsed.data.officialUrl),
    diffField("sourceUrl", existing.sourceUrl, parsed.data.sourceUrl),
    diffField("tuitionSummary", existing.tuitionSummary, nextTuitionSummary),
  ].filter((change) => change !== null);

  if (changes.length === 0) return { success: "No changes." };

  const nextStatus =
    existing.verificationStatus === "VERIFIED" ? "PENDING_REVIEW" : existing.verificationStatus;

  await db.programme.update({
    where: { id: parsed.data.id },
    data: {
      universityId: parsed.data.universityId,
      title: parsed.data.title,
      degreeLevel: parsed.data.degreeLevel,
      durationMonths: nextDurationMonths,
      officialUrl: parsed.data.officialUrl,
      sourceUrl: parsed.data.sourceUrl,
      tuitionSummary: nextTuitionSummary,
      verificationStatus: nextStatus,
      lastCheckedAt: nextStatus === "PENDING_REVIEW" ? null : undefined,
    },
  });

  await recordFieldChanges("Programme", parsed.data.id, changes);

  await audit({
    actorId: admin.id,
    action: "admin.programme_updated",
    entityType: "Programme",
    entityId: parsed.data.id,
    metadata: { fields: changes.map((change) => change.field) },
  });

  revalidatePath(`/admin/catalogue/programme/${parsed.data.id}`);
  revalidatePath(`/programmes/${existing.slug}`);
  revalidatePath("/admin/catalogue");
  return { success: "Programme updated. Verification was reset to pending review." };
}

export async function createScholarshipAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = scholarshipCreateSchema.safeParse({
    name: readString(formData, "name"),
    providerName: readString(formData, "providerName"),
    hostCountryId: readString(formData, "hostCountryId") || undefined,
    degreeLevels: readAll(formData, "degreeLevels"),
    officialUrl: readString(formData, "officialUrl"),
    sourceUrl: readString(formData, "sourceUrl"),
    description: readString(formData, "description") || undefined,
  });
  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }

  const duplicate = await db.scholarship.findFirst({
    where: { officialUrl: parsed.data.officialUrl },
    select: { slug: true },
  });
  if (duplicate) {
    return {
      error: "A scholarship with this official page is already recorded.",
      fieldErrors: { officialUrl: "Already recorded" },
    };
  }

  const provider = await db.scholarshipProvider.upsert({
    where: { slug: slugify(parsed.data.providerName) || "provider" },
    update: {},
    create: {
      slug: slugify(parsed.data.providerName) || "provider",
      name: parsed.data.providerName,
      countryId: parsed.data.hostCountryId || null,
      websiteUrl: parsed.data.officialUrl,
      verificationStatus: "PENDING_REVIEW",
      sourceUrl: parsed.data.sourceUrl,
    },
    select: { id: true, name: true },
  });

  const slug = await freeScholarshipSlug(parsed.data.name);

  const created = await db.scholarship.create({
    data: {
      slug,
      name: parsed.data.name,
      providerId: provider.id,
      hostCountryId: parsed.data.hostCountryId || null,
      degreeLevels: parsed.data.degreeLevels,
      description: parsed.data.description ?? null,
      officialUrl: parsed.data.officialUrl,
      sourceUrl: parsed.data.sourceUrl,
      verificationStatus: "PENDING_REVIEW",
    },
    select: { id: true, slug: true, name: true },
  });

  await audit({
    actorId: admin.id,
    action: "admin.scholarship_created",
    entityType: "Scholarship",
    entityId: created.id,
    metadata: { providerId: provider.id, sourceUrl: parsed.data.sourceUrl },
  });

  revalidatePath("/admin/catalogue");
  revalidatePath("/scholarships");
  redirect(`/scholarships/${created.slug}`);
}

export async function updateScholarshipAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = scholarshipEditSchema.safeParse({
    id: readString(formData, "id"),
    name: readString(formData, "name"),
    providerId: readString(formData, "providerId"),
    hostCountryId: readString(formData, "hostCountryId") || undefined,
    degreeLevels: readAll(formData, "degreeLevels"),
    officialUrl: readString(formData, "officialUrl"),
    sourceUrl: readString(formData, "sourceUrl"),
    description: readString(formData, "description") || undefined,
  });
  if (!parsed.success) return invalid(parsed.error.issues);

  const existing = await db.scholarship.findUnique({
    where: { id: parsed.data.id },
    select: {
      slug: true,
      name: true,
      providerId: true,
      hostCountryId: true,
      degreeLevels: true,
      officialUrl: true,
      sourceUrl: true,
      description: true,
      verificationStatus: true,
    },
  });
  if (!existing) return { error: "That scholarship is no longer in the catalogue." };
  if (existing.verificationStatus === "ARCHIVED") {
    return { error: "Archived scholarships cannot be edited. Restore it to a review state first." };
  }

  const provider = await db.scholarshipProvider.findUnique({
    where: { id: parsed.data.providerId },
    select: { id: true },
  });
  if (!provider) {
    return {
      error: "That provider is not in the catalogue.",
      fieldErrors: { providerId: "Pick one from the list" },
    };
  }

  const nextHostCountryId = parsed.data.hostCountryId || null;
  const nextDescription = parsed.data.description || null;

  const changes = [
    diffField("name", existing.name, parsed.data.name),
    diffField("providerId", existing.providerId, parsed.data.providerId),
    diffField("hostCountryId", existing.hostCountryId, nextHostCountryId),
    diffField("degreeLevels", existing.degreeLevels.join(","), parsed.data.degreeLevels.join(",")),
    diffField("officialUrl", existing.officialUrl, parsed.data.officialUrl),
    diffField("sourceUrl", existing.sourceUrl, parsed.data.sourceUrl),
    diffField("description", existing.description, nextDescription),
  ].filter((change) => change !== null);

  if (changes.length === 0) return { success: "No changes." };

  const nextStatus =
    existing.verificationStatus === "VERIFIED" ? "PENDING_REVIEW" : existing.verificationStatus;

  await db.scholarship.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      providerId: parsed.data.providerId,
      hostCountryId: nextHostCountryId,
      degreeLevels: parsed.data.degreeLevels,
      officialUrl: parsed.data.officialUrl,
      sourceUrl: parsed.data.sourceUrl,
      description: nextDescription,
      verificationStatus: nextStatus,
      lastCheckedAt: nextStatus === "PENDING_REVIEW" ? null : undefined,
    },
  });

  await recordFieldChanges("Scholarship", parsed.data.id, changes);

  await audit({
    actorId: admin.id,
    action: "admin.scholarship_updated",
    entityType: "Scholarship",
    entityId: parsed.data.id,
    metadata: { fields: changes.map((change) => change.field) },
  });

  revalidatePath(`/admin/catalogue/scholarship/${parsed.data.id}`);
  revalidatePath(`/scholarships/${existing.slug}`);
  revalidatePath("/admin/catalogue");
  return { success: "Scholarship updated. Verification was reset to pending review." };
}

export async function updateScholarshipProviderAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = scholarshipProviderEditSchema.safeParse({
    id: readString(formData, "id"),
    name: readString(formData, "name"),
    type: readString(formData, "type"),
    countryId: readString(formData, "countryId") || undefined,
    websiteUrl: readString(formData, "websiteUrl") || undefined,
    sourceUrl: readString(formData, "sourceUrl") || undefined,
  });
  if (!parsed.success) return invalid(parsed.error.issues);

  const existing = await db.scholarshipProvider.findUnique({
    where: { id: parsed.data.id },
    select: {
      name: true,
      type: true,
      countryId: true,
      websiteUrl: true,
      sourceUrl: true,
      verificationStatus: true,
    },
  });
  if (!existing) return { error: "That provider is no longer in the catalogue." };
  if (existing.verificationStatus === "ARCHIVED") {
    return { error: "Archived providers cannot be edited. Restore it to a review state first." };
  }

  const nextCountryId = parsed.data.countryId || null;
  const nextWebsiteUrl = parsed.data.websiteUrl || null;
  const nextSourceUrl = parsed.data.sourceUrl || null;

  const changes = [
    diffField("name", existing.name, parsed.data.name),
    diffField("type", existing.type, parsed.data.type),
    diffField("countryId", existing.countryId, nextCountryId),
    diffField("websiteUrl", existing.websiteUrl, nextWebsiteUrl),
    diffField("sourceUrl", existing.sourceUrl, nextSourceUrl),
  ].filter((change) => change !== null);

  if (changes.length === 0) return { success: "No changes." };

  const nextStatus =
    existing.verificationStatus === "VERIFIED" ? "PENDING_REVIEW" : existing.verificationStatus;

  await db.scholarshipProvider.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      countryId: nextCountryId,
      websiteUrl: nextWebsiteUrl,
      sourceUrl: nextSourceUrl,
      verificationStatus: nextStatus,
      lastCheckedAt: nextStatus === "PENDING_REVIEW" ? null : undefined,
    },
  });

  await recordFieldChanges("ScholarshipProvider", parsed.data.id, changes);

  await audit({
    actorId: admin.id,
    action: "admin.scholarship_provider_updated",
    entityType: "ScholarshipProvider",
    entityId: parsed.data.id,
    metadata: { fields: changes.map((change) => change.field) },
  });

  revalidatePath("/admin/catalogue");
  return { success: "Provider updated. Verification was reset to pending review." };
}

export async function setCatalogueVerificationAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = adminVerificationSchema.safeParse({
    entityType: readString(formData, "entityType"),
    entityId: readString(formData, "entityId"),
    status: readString(formData, "status"),
    note: readString(formData, "note") || undefined,
  });
  if (!parsed.success) return;

  const { entityType, entityId, status } = parsed.data;
  const checkedAt = status === "VERIFIED" || status === "PARTIALLY_VERIFIED" ? new Date() : null;

  const target = await applyCatalogueVerification(entityType, entityId, status, checkedAt);
  if (!target) return;

  await db.verificationRecord.create({
    data: {
      entityType,
      entityId,
      status,
      checkedById: admin.id,
      sourceUrl: target.sourceUrl,
      note: parsed.data.note ?? null,
    },
  });

  await audit({
    actorId: admin.id,
    action: "admin.catalogue_verification_set",
    entityType,
    entityId,
    metadata: { status, sourceUrl: target.sourceUrl },
  });

  revalidatePath("/admin/catalogue");
  revalidatePath(target.adminPath);
  revalidatePath(target.publicPath);
}

type VerificationStatusValue =
  "VERIFIED" | "PARTIALLY_VERIFIED" | "PENDING_REVIEW" | "CONFLICTING" | "STALE" | "ARCHIVED";

interface VerificationTarget {
  sourceUrl: string | null;
  adminPath: string;
  publicPath: string;
}

async function applyCatalogueVerification(
  entityType: string,
  entityId: string,
  status: VerificationStatusValue,
  checkedAt: Date | null,
): Promise<VerificationTarget | null> {
  switch (entityType) {
    case "Programme": {
      const record = await db.programme.findUnique({
        where: { id: entityId },
        select: { slug: true, sourceUrl: true },
      });
      if (!record) return null;
      await db.programme.update({
        where: { id: entityId },
        data: { verificationStatus: status, lastCheckedAt: checkedAt },
      });
      return {
        sourceUrl: record.sourceUrl,
        adminPath: `/admin/catalogue/programme/${entityId}`,
        publicPath: `/programmes/${record.slug}`,
      };
    }
    case "Scholarship": {
      const record = await db.scholarship.findUnique({
        where: { id: entityId },
        select: { slug: true, sourceUrl: true },
      });
      if (!record) return null;
      await db.scholarship.update({
        where: { id: entityId },
        data: { verificationStatus: status, lastCheckedAt: checkedAt },
      });
      return {
        sourceUrl: record.sourceUrl,
        adminPath: `/admin/catalogue/scholarship/${entityId}`,
        publicPath: `/scholarships/${record.slug}`,
      };
    }
    case "AdmissionRequirement": {
      const record = await db.admissionRequirement.findUnique({
        where: { id: entityId },
        select: {
          sourceUrl: true,
          programmeId: true,
          programme: { select: { slug: true } },
        },
      });
      if (!record) return null;
      await db.admissionRequirement.update({
        where: { id: entityId },
        data: { verificationStatus: status, lastCheckedAt: checkedAt },
      });
      return {
        sourceUrl: record.sourceUrl,
        adminPath: `/admin/catalogue/programme/${record.programmeId}`,
        publicPath: `/programmes/${record.programme.slug}`,
      };
    }
    case "LanguageRequirement": {
      const record = await db.languageRequirement.findUnique({
        where: { id: entityId },
        select: {
          sourceUrl: true,
          programmeId: true,
          programme: { select: { slug: true } },
        },
      });
      if (!record) return null;
      await db.languageRequirement.update({
        where: { id: entityId },
        data: { verificationStatus: status, lastCheckedAt: checkedAt },
      });
      return {
        sourceUrl: record.sourceUrl,
        adminPath: `/admin/catalogue/programme/${record.programmeId}`,
        publicPath: `/programmes/${record.programme.slug}`,
      };
    }
    case "ProgrammeDeadline": {
      const record = await db.programmeDeadline.findUnique({
        where: { id: entityId },
        select: {
          sourceUrl: true,
          programmeId: true,
          programme: { select: { slug: true } },
        },
      });
      if (!record) return null;
      await db.programmeDeadline.update({
        where: { id: entityId },
        data: { verificationStatus: status, lastCheckedAt: checkedAt },
      });
      return {
        sourceUrl: record.sourceUrl,
        adminPath: `/admin/catalogue/programme/${record.programmeId}`,
        publicPath: `/programmes/${record.programme.slug}`,
      };
    }
    case "TuitionFee": {
      const record = await db.tuitionFee.findUnique({
        where: { id: entityId },
        select: {
          sourceUrl: true,
          programmeId: true,
          programme: { select: { slug: true } },
        },
      });
      if (!record) return null;
      await db.tuitionFee.update({
        where: { id: entityId },
        data: { verificationStatus: status, lastCheckedAt: checkedAt },
      });
      return {
        sourceUrl: record.sourceUrl,
        adminPath: `/admin/catalogue/programme/${record.programmeId}`,
        publicPath: `/programmes/${record.programme.slug}`,
      };
    }
    case "ScholarshipEligibilityRule": {
      const record = await db.scholarshipEligibilityRule.findUnique({
        where: { id: entityId },
        select: {
          sourceUrl: true,
          scholarshipId: true,
          scholarship: { select: { slug: true } },
        },
      });
      if (!record) return null;
      await db.scholarshipEligibilityRule.update({
        where: { id: entityId },
        data: { verificationStatus: status, lastCheckedAt: checkedAt },
      });
      return {
        sourceUrl: record.sourceUrl,
        adminPath: `/admin/catalogue/scholarship/${record.scholarshipId}`,
        publicPath: `/scholarships/${record.scholarship.slug}`,
      };
    }
    case "ScholarshipDeadline": {
      const record = await db.scholarshipDeadline.findUnique({
        where: { id: entityId },
        select: {
          sourceUrl: true,
          scholarshipId: true,
          scholarship: { select: { slug: true } },
        },
      });
      if (!record) return null;
      await db.scholarshipDeadline.update({
        where: { id: entityId },
        data: { verificationStatus: status, lastCheckedAt: checkedAt },
      });
      return {
        sourceUrl: record.sourceUrl,
        adminPath: `/admin/catalogue/scholarship/${record.scholarshipId}`,
        publicPath: `/scholarships/${record.scholarship.slug}`,
      };
    }
    case "ScholarshipFundingComponent": {
      const record = await db.scholarshipFundingComponent.findUnique({
        where: { id: entityId },
        select: {
          sourceUrl: true,
          scholarshipId: true,
          scholarship: { select: { slug: true } },
        },
      });
      if (!record) return null;
      await db.scholarshipFundingComponent.update({
        where: { id: entityId },
        data: { verificationStatus: status, lastCheckedAt: checkedAt },
      });
      return {
        sourceUrl: record.sourceUrl,
        adminPath: `/admin/catalogue/scholarship/${record.scholarshipId}`,
        publicPath: `/scholarships/${record.scholarship.slug}`,
      };
    }
    default:
      return null;
  }
}

function invalid(issues: Array<{ path: PropertyKey[]; message: string }>): FormState {
  return { error: "Check the highlighted fields.", fieldErrors: fieldErrorsFrom(issues) };
}

async function programmeRef(id: string) {
  return db.programme.findUnique({ where: { id }, select: { id: true, slug: true } });
}

async function scholarshipRef(id: string) {
  return db.scholarship.findUnique({ where: { id }, select: { id: true, slug: true } });
}

export async function createAdmissionRequirementAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = admissionRequirementSchema.safeParse({
    programmeId: readString(formData, "programmeId"),
    kind: readString(formData, "kind"),
    label: readString(formData, "label"),
    description: readString(formData, "description") || undefined,
    qualificationTypeId: readString(formData, "qualificationTypeId") || undefined,
    subjectId: readString(formData, "subjectId") || undefined,
    gradeScaleId: readString(formData, "gradeScaleId") || undefined,
    minimumGradeLabel: readString(formData, "minimumGradeLabel") || undefined,
    minimumGradeRank: readString(formData, "minimumGradeRank") || undefined,
    isMandatory: formData.get("isMandatory") === "on",
    sourceUrl: readString(formData, "sourceUrl"),
  });
  if (!parsed.success) return invalid(parsed.error.issues);

  const programme = await programmeRef(parsed.data.programmeId);
  if (!programme) return { error: "That programme is no longer in the catalogue." };

  const created = await db.admissionRequirement.create({
    data: {
      programmeId: programme.id,
      kind: parsed.data.kind,
      label: parsed.data.label,
      description: parsed.data.description || null,
      qualificationTypeId: parsed.data.qualificationTypeId || null,
      subjectId: parsed.data.subjectId || null,
      gradeScaleId: parsed.data.gradeScaleId || null,
      minimumGradeLabel: parsed.data.minimumGradeLabel || null,
      minimumGradeRank: parsed.data.minimumGradeRank ?? null,
      isMandatory: parsed.data.isMandatory,
      sourceUrl: parsed.data.sourceUrl,
      verificationStatus: "PENDING_REVIEW",
    },
    select: { id: true },
  });

  await audit({
    actorId: admin.id,
    action: "admin.admission_requirement_created",
    entityType: "AdmissionRequirement",
    entityId: created.id,
    metadata: { programmeId: programme.id, kind: parsed.data.kind },
  });

  revalidatePath(`/admin/catalogue/programme/${programme.id}`);
  revalidatePath(`/programmes/${programme.slug}`);
  return { success: "Requirement added. Mark it checked once you confirm it against the source." };
}

export async function updateAdmissionRequirementAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = admissionRequirementEditSchema.safeParse({
    id: readString(formData, "id"),
    kind: readString(formData, "kind"),
    label: readString(formData, "label"),
    description: readString(formData, "description") || undefined,
    qualificationTypeId: readString(formData, "qualificationTypeId") || undefined,
    subjectId: readString(formData, "subjectId") || undefined,
    gradeScaleId: readString(formData, "gradeScaleId") || undefined,
    minimumGradeLabel: readString(formData, "minimumGradeLabel") || undefined,
    minimumGradeRank: readString(formData, "minimumGradeRank") || undefined,
    isMandatory: formData.get("isMandatory") === "on",
    sourceUrl: readString(formData, "sourceUrl"),
  });
  if (!parsed.success) return invalid(parsed.error.issues);

  const existing = await db.admissionRequirement.findUnique({
    where: { id: parsed.data.id },
    select: {
      kind: true,
      label: true,
      description: true,
      qualificationTypeId: true,
      subjectId: true,
      gradeScaleId: true,
      minimumGradeLabel: true,
      minimumGradeRank: true,
      isMandatory: true,
      sourceUrl: true,
      verificationStatus: true,
      programmeId: true,
      programme: { select: { slug: true } },
    },
  });
  if (!existing) return { error: "That requirement is no longer in the catalogue." };
  if (existing.verificationStatus === "ARCHIVED") {
    return { error: "Archived requirements cannot be edited. Restore it to a review state first." };
  }

  const next = {
    description: parsed.data.description || null,
    qualificationTypeId: parsed.data.qualificationTypeId || null,
    subjectId: parsed.data.subjectId || null,
    gradeScaleId: parsed.data.gradeScaleId || null,
    minimumGradeLabel: parsed.data.minimumGradeLabel || null,
    minimumGradeRank: parsed.data.minimumGradeRank ?? null,
  };

  const changes = [
    diffField("kind", existing.kind, parsed.data.kind),
    diffField("label", existing.label, parsed.data.label),
    diffField("description", existing.description, next.description),
    diffField("qualificationTypeId", existing.qualificationTypeId, next.qualificationTypeId),
    diffField("subjectId", existing.subjectId, next.subjectId),
    diffField("gradeScaleId", existing.gradeScaleId, next.gradeScaleId),
    diffField("minimumGradeLabel", existing.minimumGradeLabel, next.minimumGradeLabel),
    diffField("minimumGradeRank", existing.minimumGradeRank, next.minimumGradeRank),
    diffField("isMandatory", existing.isMandatory, parsed.data.isMandatory),
    diffField("sourceUrl", existing.sourceUrl, parsed.data.sourceUrl),
  ].filter((change) => change !== null);

  if (changes.length === 0) return { success: "No changes." };

  const nextStatus =
    existing.verificationStatus === "VERIFIED" ? "PENDING_REVIEW" : existing.verificationStatus;

  await db.admissionRequirement.update({
    where: { id: parsed.data.id },
    data: {
      kind: parsed.data.kind,
      label: parsed.data.label,
      ...next,
      isMandatory: parsed.data.isMandatory,
      sourceUrl: parsed.data.sourceUrl,
      verificationStatus: nextStatus,
      lastCheckedAt: nextStatus === "PENDING_REVIEW" ? null : undefined,
    },
  });

  await recordFieldChanges("AdmissionRequirement", parsed.data.id, changes);

  await audit({
    actorId: admin.id,
    action: "admin.admission_requirement_updated",
    entityType: "AdmissionRequirement",
    entityId: parsed.data.id,
    metadata: { fields: changes.map((change) => change.field) },
  });

  revalidatePath(`/admin/catalogue/programme/${existing.programmeId}`);
  revalidatePath(`/programmes/${existing.programme.slug}`);
  return { success: "Requirement updated. Verification was reset to pending review." };
}

export async function createLanguageRequirementAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = languageRequirementSchema.safeParse({
    programmeId: readString(formData, "programmeId"),
    testCode: readString(formData, "testCode"),
    minimumScore: readString(formData, "minimumScore"),
    scaleNote: readString(formData, "scaleNote") || undefined,
    isMandatory: formData.get("isMandatory") === "on",
    sourceUrl: readString(formData, "sourceUrl"),
  });
  if (!parsed.success) return invalid(parsed.error.issues);

  const programme = await programmeRef(parsed.data.programmeId);
  if (!programme) return { error: "That programme is no longer in the catalogue." };

  const created = await db.languageRequirement.create({
    data: {
      programmeId: programme.id,
      testCode: parsed.data.testCode,
      minimumScore: parsed.data.minimumScore,
      scaleNote: parsed.data.scaleNote || null,
      isMandatory: parsed.data.isMandatory,
      sourceUrl: parsed.data.sourceUrl,
      verificationStatus: "PENDING_REVIEW",
    },
    select: { id: true },
  });

  await audit({
    actorId: admin.id,
    action: "admin.language_requirement_created",
    entityType: "LanguageRequirement",
    entityId: created.id,
    metadata: { programmeId: programme.id, testCode: parsed.data.testCode },
  });

  revalidatePath(`/admin/catalogue/programme/${programme.id}`);
  revalidatePath(`/programmes/${programme.slug}`);
  return { success: "Language condition added." };
}

export async function updateLanguageRequirementAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = languageRequirementEditSchema.safeParse({
    id: readString(formData, "id"),
    testCode: readString(formData, "testCode"),
    minimumScore: readString(formData, "minimumScore"),
    scaleNote: readString(formData, "scaleNote") || undefined,
    isMandatory: formData.get("isMandatory") === "on",
    sourceUrl: readString(formData, "sourceUrl"),
  });
  if (!parsed.success) return invalid(parsed.error.issues);

  const existing = await db.languageRequirement.findUnique({
    where: { id: parsed.data.id },
    select: {
      testCode: true,
      minimumScore: true,
      scaleNote: true,
      isMandatory: true,
      sourceUrl: true,
      verificationStatus: true,
      programmeId: true,
      programme: { select: { slug: true } },
    },
  });
  if (!existing) return { error: "That language condition is no longer in the catalogue." };
  if (existing.verificationStatus === "ARCHIVED") {
    return { error: "Archived conditions cannot be edited. Restore it to a review state first." };
  }

  const nextScaleNote = parsed.data.scaleNote || null;
  const changes = [
    diffField("testCode", existing.testCode, parsed.data.testCode),
    diffField("minimumScore", existing.minimumScore, parsed.data.minimumScore),
    diffField("scaleNote", existing.scaleNote, nextScaleNote),
    diffField("isMandatory", existing.isMandatory, parsed.data.isMandatory),
    diffField("sourceUrl", existing.sourceUrl, parsed.data.sourceUrl),
  ].filter((change) => change !== null);

  if (changes.length === 0) return { success: "No changes." };

  const nextStatus =
    existing.verificationStatus === "VERIFIED" ? "PENDING_REVIEW" : existing.verificationStatus;

  await db.languageRequirement.update({
    where: { id: parsed.data.id },
    data: {
      testCode: parsed.data.testCode,
      minimumScore: parsed.data.minimumScore,
      scaleNote: nextScaleNote,
      isMandatory: parsed.data.isMandatory,
      sourceUrl: parsed.data.sourceUrl,
      verificationStatus: nextStatus,
      lastCheckedAt: nextStatus === "PENDING_REVIEW" ? null : undefined,
    },
  });

  await recordFieldChanges("LanguageRequirement", parsed.data.id, changes);

  await audit({
    actorId: admin.id,
    action: "admin.language_requirement_updated",
    entityType: "LanguageRequirement",
    entityId: parsed.data.id,
    metadata: { fields: changes.map((change) => change.field) },
  });

  revalidatePath(`/admin/catalogue/programme/${existing.programmeId}`);
  revalidatePath(`/programmes/${existing.programme.slug}`);
  return { success: "Language condition updated. Verification was reset to pending review." };
}

export async function createProgrammeDeadlineAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = programmeDeadlineSchema.safeParse({
    programmeId: readString(formData, "programmeId"),
    label: readString(formData, "label"),
    intake: readString(formData, "intake") || undefined,
    opensAt: readString(formData, "opensAt") || undefined,
    closesAt: readString(formData, "closesAt") || undefined,
    timezone: readString(formData, "timezone") || "UTC",
    sourceUrl: readString(formData, "sourceUrl"),
  });
  if (!parsed.success) return invalid(parsed.error.issues);

  const programme = await programmeRef(parsed.data.programmeId);
  if (!programme) return { error: "That programme is no longer in the catalogue." };

  const created = await db.programmeDeadline.create({
    data: {
      programmeId: programme.id,
      label: parsed.data.label,
      intake: parsed.data.intake || null,
      opensAt: parsed.data.opensAt ? new Date(parsed.data.opensAt) : null,
      closesAt: parsed.data.closesAt ? new Date(parsed.data.closesAt) : null,
      timezone: parsed.data.timezone,
      sourceUrl: parsed.data.sourceUrl,
      verificationStatus: "PENDING_REVIEW",
    },
    select: { id: true },
  });

  await audit({
    actorId: admin.id,
    action: "admin.programme_deadline_created",
    entityType: "ProgrammeDeadline",
    entityId: created.id,
    metadata: { programmeId: programme.id, label: parsed.data.label },
  });

  revalidatePath(`/admin/catalogue/programme/${programme.id}`);
  revalidatePath(`/programmes/${programme.slug}`);
  return { success: "Deadline added." };
}

export async function updateProgrammeDeadlineAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = programmeDeadlineEditSchema.safeParse({
    id: readString(formData, "id"),
    label: readString(formData, "label"),
    intake: readString(formData, "intake") || undefined,
    opensAt: readString(formData, "opensAt") || undefined,
    closesAt: readString(formData, "closesAt") || undefined,
    timezone: readString(formData, "timezone") || "UTC",
    sourceUrl: readString(formData, "sourceUrl"),
  });
  if (!parsed.success) return invalid(parsed.error.issues);

  const existing = await db.programmeDeadline.findUnique({
    where: { id: parsed.data.id },
    select: {
      label: true,
      intake: true,
      opensAt: true,
      closesAt: true,
      timezone: true,
      sourceUrl: true,
      verificationStatus: true,
      programmeId: true,
      programme: { select: { slug: true } },
    },
  });
  if (!existing) return { error: "That deadline is no longer in the catalogue." };
  if (existing.verificationStatus === "ARCHIVED") {
    return { error: "Archived deadlines cannot be edited. Restore it to a review state first." };
  }

  const nextIntake = parsed.data.intake || null;
  const nextOpensAt = parsed.data.opensAt ? new Date(parsed.data.opensAt) : null;
  const nextClosesAt = parsed.data.closesAt ? new Date(parsed.data.closesAt) : null;

  const changes = [
    diffField("label", existing.label, parsed.data.label),
    diffField("intake", existing.intake, nextIntake),
    diffField(
      "opensAt",
      existing.opensAt?.toISOString() ?? null,
      nextOpensAt?.toISOString() ?? null,
    ),
    diffField(
      "closesAt",
      existing.closesAt?.toISOString() ?? null,
      nextClosesAt?.toISOString() ?? null,
    ),
    diffField("timezone", existing.timezone, parsed.data.timezone),
    diffField("sourceUrl", existing.sourceUrl, parsed.data.sourceUrl),
  ].filter((change) => change !== null);

  if (changes.length === 0) return { success: "No changes." };

  const nextStatus =
    existing.verificationStatus === "VERIFIED" ? "PENDING_REVIEW" : existing.verificationStatus;

  await db.programmeDeadline.update({
    where: { id: parsed.data.id },
    data: {
      label: parsed.data.label,
      intake: nextIntake,
      opensAt: nextOpensAt,
      closesAt: nextClosesAt,
      timezone: parsed.data.timezone,
      sourceUrl: parsed.data.sourceUrl,
      verificationStatus: nextStatus,
      lastCheckedAt: nextStatus === "PENDING_REVIEW" ? null : undefined,
    },
  });

  await recordFieldChanges("ProgrammeDeadline", parsed.data.id, changes);

  await audit({
    actorId: admin.id,
    action: "admin.programme_deadline_updated",
    entityType: "ProgrammeDeadline",
    entityId: parsed.data.id,
    metadata: { fields: changes.map((change) => change.field) },
  });

  revalidatePath(`/admin/catalogue/programme/${existing.programmeId}`);
  revalidatePath(`/programmes/${existing.programme.slug}`);
  return { success: "Deadline updated. Verification was reset to pending review." };
}

export async function createTuitionFeeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = tuitionFeeSchema.safeParse({
    programmeId: readString(formData, "programmeId"),
    amount: readString(formData, "amount") || undefined,
    currencyCode: readString(formData, "currencyCode").toUpperCase(),
    period: readString(formData, "period") || "YEAR",
    isInternational: formData.get("isInternational") === "on",
    notes: readString(formData, "notes") || undefined,
    sourceUrl: readString(formData, "sourceUrl"),
  });
  if (!parsed.success) return invalid(parsed.error.issues);

  const programme = await programmeRef(parsed.data.programmeId);
  if (!programme) return { error: "That programme is no longer in the catalogue." };

  const created = await db.tuitionFee.create({
    data: {
      programmeId: programme.id,
      amount: parsed.data.amount ?? null,
      currencyCode: parsed.data.currencyCode,
      period: parsed.data.period,
      isInternational: parsed.data.isInternational,
      notes: parsed.data.notes || null,
      sourceUrl: parsed.data.sourceUrl,
      verificationStatus: "PENDING_REVIEW",
    },
    select: { id: true },
  });

  await audit({
    actorId: admin.id,
    action: "admin.tuition_fee_created",
    entityType: "TuitionFee",
    entityId: created.id,
    metadata: { programmeId: programme.id, currencyCode: parsed.data.currencyCode },
  });

  revalidatePath(`/admin/catalogue/programme/${programme.id}`);
  revalidatePath(`/programmes/${programme.slug}`);
  return { success: "Fee added. Leave the amount empty when the source only says the fee varies." };
}

export async function updateTuitionFeeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = tuitionFeeEditSchema.safeParse({
    id: readString(formData, "id"),
    amount: readString(formData, "amount") || undefined,
    currencyCode: readString(formData, "currencyCode").toUpperCase(),
    period: readString(formData, "period") || "YEAR",
    isInternational: formData.get("isInternational") === "on",
    notes: readString(formData, "notes") || undefined,
    sourceUrl: readString(formData, "sourceUrl"),
  });
  if (!parsed.success) return invalid(parsed.error.issues);

  const existing = await db.tuitionFee.findUnique({
    where: { id: parsed.data.id },
    select: {
      amount: true,
      currencyCode: true,
      period: true,
      isInternational: true,
      notes: true,
      sourceUrl: true,
      verificationStatus: true,
      programmeId: true,
      programme: { select: { slug: true } },
    },
  });
  if (!existing) return { error: "That fee is no longer in the catalogue." };
  if (existing.verificationStatus === "ARCHIVED") {
    return { error: "Archived fees cannot be edited. Restore it to a review state first." };
  }

  const nextAmount = parsed.data.amount ?? null;
  const nextNotes = parsed.data.notes || null;

  const changes = [
    diffField("amount", existing.amount?.toString() ?? null, nextAmount?.toString() ?? null),
    diffField("currencyCode", existing.currencyCode, parsed.data.currencyCode),
    diffField("period", existing.period, parsed.data.period),
    diffField("isInternational", existing.isInternational, parsed.data.isInternational),
    diffField("notes", existing.notes, nextNotes),
    diffField("sourceUrl", existing.sourceUrl, parsed.data.sourceUrl),
  ].filter((change) => change !== null);

  if (changes.length === 0) return { success: "No changes." };

  const nextStatus =
    existing.verificationStatus === "VERIFIED" ? "PENDING_REVIEW" : existing.verificationStatus;

  await db.tuitionFee.update({
    where: { id: parsed.data.id },
    data: {
      amount: nextAmount,
      currencyCode: parsed.data.currencyCode,
      period: parsed.data.period,
      isInternational: parsed.data.isInternational,
      notes: nextNotes,
      sourceUrl: parsed.data.sourceUrl,
      verificationStatus: nextStatus,
      lastCheckedAt: nextStatus === "PENDING_REVIEW" ? null : undefined,
    },
  });

  await recordFieldChanges("TuitionFee", parsed.data.id, changes);

  await audit({
    actorId: admin.id,
    action: "admin.tuition_fee_updated",
    entityType: "TuitionFee",
    entityId: parsed.data.id,
    metadata: { fields: changes.map((change) => change.field) },
  });

  revalidatePath(`/admin/catalogue/programme/${existing.programmeId}`);
  revalidatePath(`/programmes/${existing.programme.slug}`);
  return { success: "Fee updated. Verification was reset to pending review." };
}

export async function createScholarshipEligibilityRuleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = scholarshipEligibilityRuleSchema.safeParse({
    scholarshipId: readString(formData, "scholarshipId"),
    kind: readString(formData, "kind"),
    label: readString(formData, "label"),
    valueString: readString(formData, "valueString") || undefined,
    minValue: readString(formData, "minValue") || undefined,
    isMandatory: formData.get("isMandatory") === "on",
    sourceUrl: readString(formData, "sourceUrl"),
  });
  if (!parsed.success) return invalid(parsed.error.issues);

  const scholarship = await scholarshipRef(parsed.data.scholarshipId);
  if (!scholarship) return { error: "That scholarship is no longer in the catalogue." };

  const created = await db.scholarshipEligibilityRule.create({
    data: {
      scholarshipId: scholarship.id,
      kind: parsed.data.kind,
      label: parsed.data.label,
      valueString: parsed.data.valueString || null,
      minValue: parsed.data.minValue ?? null,
      isMandatory: parsed.data.isMandatory,
      sourceUrl: parsed.data.sourceUrl,
      verificationStatus: "PENDING_REVIEW",
    },
    select: { id: true },
  });

  await audit({
    actorId: admin.id,
    action: "admin.scholarship_rule_created",
    entityType: "ScholarshipEligibilityRule",
    entityId: created.id,
    metadata: { scholarshipId: scholarship.id, kind: parsed.data.kind },
  });

  revalidatePath(`/admin/catalogue/scholarship/${scholarship.id}`);
  revalidatePath(`/scholarships/${scholarship.slug}`);
  return { success: "Eligibility condition added." };
}

export async function updateScholarshipEligibilityRuleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = scholarshipEligibilityRuleEditSchema.safeParse({
    id: readString(formData, "id"),
    kind: readString(formData, "kind"),
    label: readString(formData, "label"),
    valueString: readString(formData, "valueString") || undefined,
    minValue: readString(formData, "minValue") || undefined,
    isMandatory: formData.get("isMandatory") === "on",
    sourceUrl: readString(formData, "sourceUrl"),
  });
  if (!parsed.success) return invalid(parsed.error.issues);

  const existing = await db.scholarshipEligibilityRule.findUnique({
    where: { id: parsed.data.id },
    select: {
      kind: true,
      label: true,
      valueString: true,
      minValue: true,
      isMandatory: true,
      sourceUrl: true,
      verificationStatus: true,
      scholarshipId: true,
      scholarship: { select: { slug: true } },
    },
  });
  if (!existing) return { error: "That eligibility condition is no longer in the catalogue." };
  if (existing.verificationStatus === "ARCHIVED") {
    return { error: "Archived conditions cannot be edited. Restore it to a review state first." };
  }

  const nextValueString = parsed.data.valueString || null;
  const nextMinValue = parsed.data.minValue ?? null;

  const changes = [
    diffField("kind", existing.kind, parsed.data.kind),
    diffField("label", existing.label, parsed.data.label),
    diffField("valueString", existing.valueString, nextValueString),
    diffField("minValue", existing.minValue, nextMinValue),
    diffField("isMandatory", existing.isMandatory, parsed.data.isMandatory),
    diffField("sourceUrl", existing.sourceUrl, parsed.data.sourceUrl),
  ].filter((change) => change !== null);

  if (changes.length === 0) return { success: "No changes." };

  const nextStatus =
    existing.verificationStatus === "VERIFIED" ? "PENDING_REVIEW" : existing.verificationStatus;

  await db.scholarshipEligibilityRule.update({
    where: { id: parsed.data.id },
    data: {
      kind: parsed.data.kind,
      label: parsed.data.label,
      valueString: nextValueString,
      minValue: nextMinValue,
      isMandatory: parsed.data.isMandatory,
      sourceUrl: parsed.data.sourceUrl,
      verificationStatus: nextStatus,
      lastCheckedAt: nextStatus === "PENDING_REVIEW" ? null : undefined,
    },
  });

  await recordFieldChanges("ScholarshipEligibilityRule", parsed.data.id, changes);

  await audit({
    actorId: admin.id,
    action: "admin.scholarship_rule_updated",
    entityType: "ScholarshipEligibilityRule",
    entityId: parsed.data.id,
    metadata: { fields: changes.map((change) => change.field) },
  });

  revalidatePath(`/admin/catalogue/scholarship/${existing.scholarshipId}`);
  revalidatePath(`/scholarships/${existing.scholarship.slug}`);
  return { success: "Eligibility condition updated. Verification was reset to pending review." };
}

export async function createScholarshipFundingComponentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = scholarshipFundingComponentSchema.safeParse({
    scholarshipId: readString(formData, "scholarshipId"),
    component: readString(formData, "component"),
    coverage: readString(formData, "coverage") || "UNSPECIFIED",
    amount: readString(formData, "amount") || undefined,
    currencyCode: readString(formData, "currencyCode").toUpperCase() || undefined,
    description: readString(formData, "description") || undefined,
    isSpecified: formData.get("isSpecified") === "on",
    sourceUrl: readString(formData, "sourceUrl") || undefined,
  });
  if (!parsed.success) return invalid(parsed.error.issues);

  const scholarship = await scholarshipRef(parsed.data.scholarshipId);
  if (!scholarship) return { error: "That scholarship is no longer in the catalogue." };

  const existing = await db.scholarshipFundingComponent.findUnique({
    where: {
      scholarshipId_component: {
        scholarshipId: scholarship.id,
        component: parsed.data.component,
      },
    },
    select: { id: true },
  });
  if (existing) {
    return {
      error: "That funding component is already recorded for this scholarship.",
      fieldErrors: { component: "Already recorded" },
    };
  }

  const created = await db.scholarshipFundingComponent.create({
    data: {
      scholarshipId: scholarship.id,
      component: parsed.data.component,
      coverage: parsed.data.coverage,
      amount: parsed.data.amount ?? null,
      currencyCode: parsed.data.currencyCode || null,
      description: parsed.data.description || null,
      isSpecified: parsed.data.isSpecified,
      sourceUrl: parsed.data.sourceUrl || null,
      verificationStatus: "PENDING_REVIEW",
      lastCheckedAt: parsed.data.sourceUrl ? new Date() : null,
    },
    select: { id: true },
  });

  await audit({
    actorId: admin.id,
    action: "admin.scholarship_funding_created",
    entityType: "ScholarshipFundingComponent",
    entityId: created.id,
    metadata: { scholarshipId: scholarship.id, component: parsed.data.component },
  });

  revalidatePath(`/admin/catalogue/scholarship/${scholarship.id}`);
  revalidatePath(`/scholarships/${scholarship.slug}`);
  return { success: "Funding component added." };
}

export async function updateScholarshipFundingComponentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = scholarshipFundingComponentEditSchema.safeParse({
    id: readString(formData, "id"),
    coverage: readString(formData, "coverage") || "UNSPECIFIED",
    amount: readString(formData, "amount") || undefined,
    currencyCode: readString(formData, "currencyCode").toUpperCase() || undefined,
    description: readString(formData, "description") || undefined,
    isSpecified: formData.get("isSpecified") === "on",
    sourceUrl: readString(formData, "sourceUrl") || undefined,
  });
  if (!parsed.success) return invalid(parsed.error.issues);

  const existing = await db.scholarshipFundingComponent.findUnique({
    where: { id: parsed.data.id },
    select: {
      coverage: true,
      amount: true,
      currencyCode: true,
      description: true,
      isSpecified: true,
      sourceUrl: true,
      verificationStatus: true,
      scholarshipId: true,
      scholarship: { select: { slug: true } },
    },
  });
  if (!existing) return { error: "That funding component is no longer in the catalogue." };
  if (existing.verificationStatus === "ARCHIVED") {
    return { error: "Archived components cannot be edited. Restore it to a review state first." };
  }

  const nextAmount = parsed.data.amount ?? null;
  const nextCurrencyCode = parsed.data.currencyCode || null;
  const nextDescription = parsed.data.description || null;
  const nextSourceUrl = parsed.data.sourceUrl || null;

  const changes = [
    diffField("coverage", existing.coverage, parsed.data.coverage),
    diffField("amount", existing.amount?.toString() ?? null, nextAmount?.toString() ?? null),
    diffField("currencyCode", existing.currencyCode, nextCurrencyCode),
    diffField("description", existing.description, nextDescription),
    diffField("isSpecified", existing.isSpecified, parsed.data.isSpecified),
    diffField("sourceUrl", existing.sourceUrl, nextSourceUrl),
  ].filter((change) => change !== null);

  if (changes.length === 0) return { success: "No changes." };

  const nextStatus =
    existing.verificationStatus === "VERIFIED" ? "PENDING_REVIEW" : existing.verificationStatus;

  await db.scholarshipFundingComponent.update({
    where: { id: parsed.data.id },
    data: {
      coverage: parsed.data.coverage,
      amount: nextAmount,
      currencyCode: nextCurrencyCode,
      description: nextDescription,
      isSpecified: parsed.data.isSpecified,
      sourceUrl: nextSourceUrl,
      verificationStatus: nextStatus,
      lastCheckedAt: nextStatus === "PENDING_REVIEW" ? null : undefined,
    },
  });

  await recordFieldChanges("ScholarshipFundingComponent", parsed.data.id, changes);

  await audit({
    actorId: admin.id,
    action: "admin.scholarship_funding_updated",
    entityType: "ScholarshipFundingComponent",
    entityId: parsed.data.id,
    metadata: { fields: changes.map((change) => change.field) },
  });

  revalidatePath(`/admin/catalogue/scholarship/${existing.scholarshipId}`);
  revalidatePath(`/scholarships/${existing.scholarship.slug}`);
  return { success: "Funding component updated. Verification was reset to pending review." };
}

export async function createScholarshipDeadlineAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = scholarshipDeadlineSchema.safeParse({
    scholarshipId: readString(formData, "scholarshipId"),
    label: readString(formData, "label"),
    opensAt: readString(formData, "opensAt") || undefined,
    closesAt: readString(formData, "closesAt") || undefined,
    timezone: readString(formData, "timezone") || "UTC",
    sourceUrl: readString(formData, "sourceUrl"),
  });
  if (!parsed.success) return invalid(parsed.error.issues);

  const scholarship = await scholarshipRef(parsed.data.scholarshipId);
  if (!scholarship) return { error: "That scholarship is no longer in the catalogue." };

  const created = await db.scholarshipDeadline.create({
    data: {
      scholarshipId: scholarship.id,
      label: parsed.data.label,
      opensAt: parsed.data.opensAt ? new Date(parsed.data.opensAt) : null,
      closesAt: parsed.data.closesAt ? new Date(parsed.data.closesAt) : null,
      timezone: parsed.data.timezone,
      sourceUrl: parsed.data.sourceUrl,
      verificationStatus: "PENDING_REVIEW",
    },
    select: { id: true },
  });

  await audit({
    actorId: admin.id,
    action: "admin.scholarship_deadline_created",
    entityType: "ScholarshipDeadline",
    entityId: created.id,
    metadata: { scholarshipId: scholarship.id, label: parsed.data.label },
  });

  revalidatePath(`/admin/catalogue/scholarship/${scholarship.id}`);
  revalidatePath(`/scholarships/${scholarship.slug}`);
  return { success: "Deadline added." };
}

export async function updateScholarshipDeadlineAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = scholarshipDeadlineEditSchema.safeParse({
    id: readString(formData, "id"),
    label: readString(formData, "label"),
    opensAt: readString(formData, "opensAt") || undefined,
    closesAt: readString(formData, "closesAt") || undefined,
    timezone: readString(formData, "timezone") || "UTC",
    sourceUrl: readString(formData, "sourceUrl"),
  });
  if (!parsed.success) return invalid(parsed.error.issues);

  const existing = await db.scholarshipDeadline.findUnique({
    where: { id: parsed.data.id },
    select: {
      label: true,
      opensAt: true,
      closesAt: true,
      timezone: true,
      sourceUrl: true,
      verificationStatus: true,
      scholarshipId: true,
      scholarship: { select: { slug: true } },
    },
  });
  if (!existing) return { error: "That deadline is no longer in the catalogue." };
  if (existing.verificationStatus === "ARCHIVED") {
    return { error: "Archived deadlines cannot be edited. Restore it to a review state first." };
  }

  const nextOpensAt = parsed.data.opensAt ? new Date(parsed.data.opensAt) : null;
  const nextClosesAt = parsed.data.closesAt ? new Date(parsed.data.closesAt) : null;

  const changes = [
    diffField("label", existing.label, parsed.data.label),
    diffField(
      "opensAt",
      existing.opensAt?.toISOString() ?? null,
      nextOpensAt?.toISOString() ?? null,
    ),
    diffField(
      "closesAt",
      existing.closesAt?.toISOString() ?? null,
      nextClosesAt?.toISOString() ?? null,
    ),
    diffField("timezone", existing.timezone, parsed.data.timezone),
    diffField("sourceUrl", existing.sourceUrl, parsed.data.sourceUrl),
  ].filter((change) => change !== null);

  if (changes.length === 0) return { success: "No changes." };

  const nextStatus =
    existing.verificationStatus === "VERIFIED" ? "PENDING_REVIEW" : existing.verificationStatus;

  await db.scholarshipDeadline.update({
    where: { id: parsed.data.id },
    data: {
      label: parsed.data.label,
      opensAt: nextOpensAt,
      closesAt: nextClosesAt,
      timezone: parsed.data.timezone,
      sourceUrl: parsed.data.sourceUrl,
      verificationStatus: nextStatus,
      lastCheckedAt: nextStatus === "PENDING_REVIEW" ? null : undefined,
    },
  });

  await recordFieldChanges("ScholarshipDeadline", parsed.data.id, changes);

  await audit({
    actorId: admin.id,
    action: "admin.scholarship_deadline_updated",
    entityType: "ScholarshipDeadline",
    entityId: parsed.data.id,
    metadata: { fields: changes.map((change) => change.field) },
  });

  revalidatePath(`/admin/catalogue/scholarship/${existing.scholarshipId}`);
  revalidatePath(`/scholarships/${existing.scholarship.slug}`);
  return { success: "Deadline updated. Verification was reset to pending review." };
}
