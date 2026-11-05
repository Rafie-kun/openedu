"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@openedu/database";
import {
  adminVerificationSchema,
  candidatePromotionSchema,
  programmeCreateSchema,
  reviewDecisionSchema,
  scholarshipCreateSchema,
} from "@openedu/validation";
import { audit } from "@/lib/audit";
import { draftFromPayload, slugify, uniqueSlug } from "@/lib/candidates";
import { fieldErrorsFrom, readAll, readString, type FormState } from "@/lib/forms";
import { requireAdmin } from "@/lib/session";

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

  let slug: string | null = null;
  let sourceUrl: string | null = null;

  if (entityType === "Programme") {
    const record = await db.programme.findUnique({
      where: { id: entityId },
      select: { slug: true, sourceUrl: true },
    });
    if (!record) return;
    slug = record.slug;
    sourceUrl = record.sourceUrl;
    await db.programme.update({
      where: { id: entityId },
      data: { verificationStatus: status, lastCheckedAt: checkedAt },
    });
  } else if (entityType === "Scholarship") {
    const record = await db.scholarship.findUnique({
      where: { id: entityId },
      select: { slug: true, sourceUrl: true },
    });
    if (!record) return;
    slug = record.slug;
    sourceUrl = record.sourceUrl;
    await db.scholarship.update({
      where: { id: entityId },
      data: { verificationStatus: status, lastCheckedAt: checkedAt },
    });
  } else {
    return;
  }

  await db.verificationRecord.create({
    data: {
      entityType,
      entityId,
      status,
      checkedById: admin.id,
      sourceUrl,
      note: parsed.data.note ?? null,
    },
  });

  await audit({
    actorId: admin.id,
    action: "admin.catalogue_verification_set",
    entityType,
    entityId,
    metadata: { status, sourceUrl },
  });

  revalidatePath("/admin/catalogue");
  revalidatePath(entityType === "Programme" ? `/programmes/${slug}` : `/scholarships/${slug}`);
}
