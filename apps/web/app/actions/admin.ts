"use server";

import { revalidatePath } from "next/cache";
import { db } from "@openedu/database";
import { candidatePromotionSchema, reviewDecisionSchema } from "@openedu/validation";
import { audit } from "@/lib/audit";
import { draftFromPayload, slugify, uniqueSlug } from "@/lib/candidates";
import { fieldErrorsFrom, readString, type FormState } from "@/lib/forms";
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
