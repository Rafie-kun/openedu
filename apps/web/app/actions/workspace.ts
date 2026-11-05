"use server";

import { db } from "@openedu/database";
import {
  applicationDocumentSchema,
  applicationSchema,
  applicationStatusSchema,
  applicationTaskSchema,
} from "@openedu/validation";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/session";
import { readString, type FormState } from "@/lib/forms";

async function profileFor(userId: string) {
  return db.studentProfile.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });
}

export async function toggleSaveAction(formData: FormData): Promise<void> {
  const user = await requireUser("/dashboard");
  const kind = readString(formData, "kind");
  const targetId = readString(formData, "targetId");
  const returnTo = readString(formData, "returnTo") || "/dashboard";

  if (!["UNIVERSITY", "PROGRAMME", "SCHOLARSHIP"].includes(kind) || !targetId) return;

  const profile = await profileFor(user.id);
  const targetKey = `${kind}:${targetId}`;

  const exists = await db.savedOpportunity.findUnique({
    where: { profileId_targetKey: { profileId: profile.id, targetKey } },
    select: { id: true },
  });

  if (exists) {
    await db.savedOpportunity.delete({ where: { id: exists.id } });
  } else {
    const validTarget =
      kind === "UNIVERSITY"
        ? await db.university.findUnique({ where: { id: targetId }, select: { id: true } })
        : kind === "PROGRAMME"
          ? await db.programme.findUnique({ where: { id: targetId }, select: { id: true } })
          : await db.scholarship.findUnique({ where: { id: targetId }, select: { id: true } });

    if (!validTarget) return;

    await db.savedOpportunity.create({
      data: {
        profileId: profile.id,
        kind: kind as "UNIVERSITY" | "PROGRAMME" | "SCHOLARSHIP",
        targetKey,
        universityId: kind === "UNIVERSITY" ? targetId : null,
        programmeId: kind === "PROGRAMME" ? targetId : null,
        scholarshipId: kind === "SCHOLARSHIP" ? targetId : null,
      },
    });
  }

  revalidatePath(returnTo);
  revalidatePath("/saved");
}

export async function createApplicationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/applications");
  const parsed = applicationSchema.safeParse({
    title: readString(formData, "title"),
    programmeId: readString(formData, "programmeId"),
    scholarshipId: readString(formData, "scholarshipId"),
    deadline: readString(formData, "deadline"),
    feeAmount: readString(formData, "feeAmount") || undefined,
    feeCurrency: readString(formData, "feeCurrency").toUpperCase(),
    status: readString(formData, "status") || "INTERESTED",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the application details." };
  }

  const profile = await profileFor(user.id);
  const data = parsed.data;

  const application = await db.studentApplication.create({
    data: {
      profileId: profile.id,
      title: data.title,
      programmeId: data.programmeId || null,
      scholarshipId: data.scholarshipId || null,
      deadline: data.deadline ? new Date(`${data.deadline}T00:00:00.000Z`) : null,
      feeAmount: data.feeAmount ?? null,
      feeCurrency: data.feeCurrency || null,
      status: data.status,
      statusHistory: { create: { status: data.status, note: "Created by you" } },
    },
    select: { id: true },
  });

  await audit({
    actorId: user.id,
    action: "application.create",
    entityType: "StudentApplication",
    entityId: application.id,
  });

  revalidatePath("/applications");
  return { success: "Application added to your tracker." };
}

export async function updateApplicationStatusAction(formData: FormData): Promise<void> {
  const user = await requireUser("/applications");
  const parsed = applicationStatusSchema.safeParse({ status: readString(formData, "status") });
  const applicationId = readString(formData, "applicationId");
  if (!parsed.success || !applicationId) return;

  const profile = await profileFor(user.id);
  const owned = await db.studentApplication.findFirst({
    where: { id: applicationId, profileId: profile.id },
    select: { id: true },
  });
  if (!owned) return;

  await db.studentApplication.update({
    where: { id: owned.id },
    data: {
      status: parsed.data.status,
      statusHistory: { create: { status: parsed.data.status, note: "Updated by you" } },
    },
  });

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/applications");
}

export async function deleteApplicationAction(formData: FormData): Promise<void> {
  const user = await requireUser("/applications");
  const applicationId = readString(formData, "applicationId");
  const profile = await profileFor(user.id);
  await db.studentApplication.deleteMany({
    where: { id: applicationId, profileId: profile.id },
  });
  revalidatePath("/applications");
}

export async function addApplicationNoteAction(formData: FormData): Promise<void> {
  const user = await requireUser("/applications");
  const applicationId = readString(formData, "applicationId");
  const body = readString(formData, "body");
  if (!applicationId || body.length < 2) return;

  const profile = await profileFor(user.id);
  const owned = await db.studentApplication.findFirst({
    where: { id: applicationId, profileId: profile.id },
    select: { id: true },
  });
  if (!owned) return;

  await db.applicationNote.create({
    data: { applicationId: owned.id, body: body.slice(0, 4000) },
  });
  revalidatePath(`/applications/${applicationId}`);
}

export async function addApplicationTaskAction(formData: FormData): Promise<void> {
  const user = await requireUser("/applications");
  const applicationId = readString(formData, "applicationId");
  const parsed = applicationTaskSchema.safeParse({
    title: readString(formData, "title"),
    dueAt: readString(formData, "dueAt"),
    isRequired: formData.get("isRequired") === "on",
  });
  if (!applicationId || !parsed.success) return;

  const profile = await profileFor(user.id);
  const owned = await db.studentApplication.findFirst({
    where: { id: applicationId, profileId: profile.id },
    select: { id: true },
  });
  if (!owned) return;

  await db.applicationTask.create({
    data: {
      applicationId: owned.id,
      title: parsed.data.title,
      dueAt: parsed.data.dueAt ? new Date(`${parsed.data.dueAt}T00:00:00.000Z`) : null,
      isRequired: parsed.data.isRequired,
    },
  });

  revalidatePath(`/applications/${applicationId}`);
}

export async function toggleApplicationTaskAction(formData: FormData): Promise<void> {
  const user = await requireUser("/applications");
  const applicationId = readString(formData, "applicationId");
  const taskId = readString(formData, "taskId");
  if (!applicationId || !taskId) return;

  const profile = await profileFor(user.id);
  const task = await db.applicationTask.findFirst({
    where: { id: taskId, application: { id: applicationId, profileId: profile.id } },
    select: { id: true, completedAt: true },
  });
  if (!task) return;

  await db.applicationTask.update({
    where: { id: task.id },
    data: { completedAt: task.completedAt ? null : new Date() },
  });

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/calendar");
}

export async function deleteApplicationTaskAction(formData: FormData): Promise<void> {
  const user = await requireUser("/applications");
  const applicationId = readString(formData, "applicationId");
  const taskId = readString(formData, "taskId");
  if (!applicationId || !taskId) return;

  const profile = await profileFor(user.id);
  await db.applicationTask.deleteMany({
    where: { id: taskId, application: { id: applicationId, profileId: profile.id } },
  });

  revalidatePath(`/applications/${applicationId}`);
}

export async function addApplicationDocumentAction(formData: FormData): Promise<void> {
  const user = await requireUser("/applications");
  const applicationId = readString(formData, "applicationId");
  const parsed = applicationDocumentSchema.safeParse({ label: readString(formData, "label") });
  if (!applicationId || !parsed.success) return;

  const profile = await profileFor(user.id);
  const owned = await db.studentApplication.findFirst({
    where: { id: applicationId, profileId: profile.id },
    select: { id: true },
  });
  if (!owned) return;

  await db.applicationDocument.create({
    data: { applicationId: owned.id, label: parsed.data.label },
  });

  revalidatePath(`/applications/${applicationId}`);
}

export async function toggleApplicationDocumentAction(formData: FormData): Promise<void> {
  const user = await requireUser("/applications");
  const applicationId = readString(formData, "applicationId");
  const documentId = readString(formData, "documentId");
  if (!applicationId || !documentId) return;

  const profile = await profileFor(user.id);
  const document = await db.applicationDocument.findFirst({
    where: { id: documentId, application: { id: applicationId, profileId: profile.id } },
    select: { id: true, uploadedAt: true },
  });
  if (!document) return;

  await db.applicationDocument.update({
    where: { id: document.id },
    data: { uploadedAt: document.uploadedAt ? null : new Date() },
  });

  revalidatePath(`/applications/${applicationId}`);
}

export async function deleteApplicationDocumentAction(formData: FormData): Promise<void> {
  const user = await requireUser("/applications");
  const applicationId = readString(formData, "applicationId");
  const documentId = readString(formData, "documentId");
  if (!applicationId || !documentId) return;

  const profile = await profileFor(user.id);
  await db.applicationDocument.deleteMany({
    where: { id: documentId, application: { id: applicationId, profileId: profile.id } },
  });

  revalidatePath(`/applications/${applicationId}`);
}

export async function markNotificationsReadAction(): Promise<void> {
  const user = await requireUser("/notifications");
  await db.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}

export async function updateNotificationPreferencesAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/account");

  await db.userPreference.upsert({
    where: { userId: user.id },
    update: {
      emailNotifications: formData.get("email") === "on",
      deadlineReminders: formData.get("deadlineReminders") === "on",
      dataChangeAlerts: formData.get("dataChangeAlerts") === "on",
    },
    create: {
      userId: user.id,
      emailNotifications: formData.get("email") === "on",
      deadlineReminders: formData.get("deadlineReminders") === "on",
      dataChangeAlerts: formData.get("dataChangeAlerts") === "on",
    },
  });

  revalidatePath("/account");
  return { success: "Notification preferences saved." };
}
