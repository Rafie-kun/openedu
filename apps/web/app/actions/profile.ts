"use server";

import { db } from "@openedu/database";
import {
  deleteAccountSchema,
  languageTestSchema,
  passwordChangeSchema,
  profileSchema,
  qualificationSchema,
} from "@openedu/validation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { requireUser, createSession } from "@/lib/session";
import { clientFingerprint } from "@/lib/rate-limit";
import { readString, type FormState } from "@/lib/forms";

function parseSubjectResults(raw: string): unknown[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

async function profileIdForUser(userId: string): Promise<string> {
  const profile = await db.studentProfile.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });
  return profile.id;
}

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/profile");

  const parsed = profileSchema.safeParse({
    displayName: readString(formData, "displayName") || undefined,
    dateOfBirth: readString(formData, "dateOfBirth"),
    countryOfResidenceId: readString(formData, "countryOfResidenceId"),
    nationalityCountryId: readString(formData, "nationalityCountryId"),
    intendedDegreeLevel: readString(formData, "intendedDegreeLevel"),
    intendedSubjectId: readString(formData, "intendedSubjectId"),
    financialNeedLevel: readString(formData, "financialNeedLevel"),
    preferredCountryIds: formData
      .getAll("preferredCountryIds")
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Some fields need attention.", fieldErrors };
  }

  const data = parsed.data;
  const profileId = await profileIdForUser(user.id);

  try {
    await db.$transaction(async (tx) => {
      await tx.studentProfile.update({
        where: { id: profileId },
        data: {
          displayName: data.displayName || null,
          dateOfBirth: data.dateOfBirth ? new Date(`${data.dateOfBirth}T00:00:00.000Z`) : null,
          countryOfResidenceId: data.countryOfResidenceId || null,
          nationalityCountryId: data.nationalityCountryId || null,
          intendedDegreeLevel: data.intendedDegreeLevel || null,
          intendedSubjectId: data.intendedSubjectId || null,
          financialNeedLevel: data.financialNeedLevel || null,
        },
      });

      await tx.studentPreferredDestination.deleteMany({ where: { profileId } });
      if (data.preferredCountryIds.length > 0) {
        await tx.studentPreferredDestination.createMany({
          data: data.preferredCountryIds.map((countryId, index) => ({
            profileId,
            countryId,
            priority: index,
          })),
        });
      }
    });
  } catch (error) {
    console.error("profile-update-failed", error);
    return { error: "The profile could not be saved. Please try again." };
  }

  await audit({
    actorId: user.id,
    action: "profile.update",
    entityType: "StudentProfile",
    entityId: profileId,
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: "Profile saved." };
}

export async function addQualificationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/qualifications");

  const parsed = qualificationSchema.safeParse({
    qualificationTypeId: readString(formData, "qualificationTypeId"),
    awardingBodyId: readString(formData, "awardingBodyId"),
    gradeScaleId: readString(formData, "gradeScaleId"),
    status: readString(formData, "status"),
    sessionYear: readString(formData, "sessionYear") || undefined,
    sessionSeries: readString(formData, "sessionSeries") || undefined,
    overallGradeLabel: readString(formData, "overallGradeLabel") || undefined,
    notes: readString(formData, "notes") || undefined,
    subjectResults: parseSubjectResults(readString(formData, "subjectResults")),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Check the qualification details.", fieldErrors };
  }

  const profileId = await profileIdForUser(user.id);
  const input = parsed.data;

  const type = await db.qualificationType.findUnique({
    where: { id: input.qualificationTypeId },
    select: { id: true, code: true },
  });
  if (!type) return { error: "That qualification type is not recognised." };

  const gradeScaleId = input.gradeScaleId || null;
  const bands = gradeScaleId ? await db.gradeBand.findMany({ where: { gradeScaleId } }) : [];
  const bandByLabel = new Map(bands.map((band) => [band.label, band]));

  const overallBand = input.overallGradeLabel
    ? bandByLabel.get(input.overallGradeLabel)
    : undefined;
  if (input.overallGradeLabel && !overallBand) {
    return { error: "The overall grade is not part of the selected grade scale." };
  }

  const results = [] as Array<{
    subjectId: string;
    gradeLabel: string;
    gradeRank: number | null;
    kind: "ACHIEVED" | "PREDICTED" | "ESTIMATED";
  }>;

  for (const item of input.subjectResults) {
    const band = bandByLabel.get(item.gradeLabel);
    if (!band) {
      return { error: `The grade "${item.gradeLabel}" is not part of the selected grade scale.` };
    }
    const subject = await db.subject.findUnique({
      where: { id: item.subjectId },
      select: { id: true },
    });
    if (!subject) return { error: "One of the selected subjects could not be found." };
    results.push({
      subjectId: subject.id,
      gradeLabel: item.gradeLabel,
      gradeRank: band.rank,
      kind: item.kind,
    });
  }

  const duplicate = new Set<string>();
  for (const result of results) {
    const key = `${result.subjectId}:${result.kind}`;
    if (duplicate.has(key)) return { error: "Each subject can only appear once per result type." };
    duplicate.add(key);
  }

  try {
    await db.studentQualification.create({
      data: {
        profileId,
        qualificationTypeId: type.id,
        awardingBodyId: input.awardingBodyId || null,
        gradeScaleId,
        status: input.status,
        sessionYear: input.sessionYear ?? null,
        sessionSeries: input.sessionSeries || null,
        overallGradeLabel: overallBand?.label ?? null,
        overallGradeRank: overallBand?.rank ?? null,
        notes: input.notes || null,
        verificationStatus: "UNVERIFIED",
        subjectResults: { create: results },
      },
    });
  } catch (error) {
    console.error("qualification-create-failed", error);
    return { error: "The qualification could not be saved." };
  }

  await audit({
    actorId: user.id,
    action: "qualification.create",
    entityType: "StudentQualification",
    entityId: type.code,
  });

  revalidatePath("/qualifications");
  revalidatePath("/dashboard");
  return { success: "Qualification added." };
}

export async function deleteQualificationAction(formData: FormData): Promise<void> {
  const user = await requireUser("/qualifications");
  const id = readString(formData, "qualificationId");
  const profile = await db.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile || !id) return;

  const owned = await db.studentQualification.findFirst({
    where: { id, profileId: profile.id },
    select: { id: true },
  });
  if (!owned) return;

  await db.studentQualification.delete({ where: { id: owned.id } });
  await audit({
    actorId: user.id,
    action: "qualification.delete",
    entityType: "StudentQualification",
    entityId: owned.id,
  });
  revalidatePath("/qualifications");
  revalidatePath("/dashboard");
}

export async function addLanguageTestAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/qualifications");
  const parsed = languageTestSchema.safeParse({
    testCode: readString(formData, "testCode"),
    score: readString(formData, "score"),
    scaleNote: readString(formData, "scaleNote") || undefined,
    testDate: readString(formData, "testDate"),
    expiresAt: readString(formData, "expiresAt"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the test details." };
  }

  const profileId = await profileIdForUser(user.id);
  await db.languageQualification.create({
    data: {
      profileId,
      testCode: parsed.data.testCode,
      score: parsed.data.score,
      scaleNote: parsed.data.scaleNote || null,
      testDate: parsed.data.testDate ? new Date(`${parsed.data.testDate}T00:00:00.000Z`) : null,
      expiresAt: parsed.data.expiresAt ? new Date(`${parsed.data.expiresAt}T00:00:00.000Z`) : null,
    },
  });

  revalidatePath("/qualifications");
  return { success: "Language test saved." };
}

export async function deleteLanguageTestAction(formData: FormData): Promise<void> {
  const user = await requireUser("/qualifications");
  const id = readString(formData, "languageTestId");
  const profile = await db.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile || !id) return;

  await db.languageQualification.deleteMany({ where: { id, profileId: profile.id } });
  revalidatePath("/qualifications");
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/account");
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: readString(formData, "currentPassword"),
    newPassword: readString(formData, "newPassword"),
    confirmPassword: readString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the password fields." };
  }

  const record = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record) return { error: "Account not found." };

  const valid = await verifyPassword(parsed.data.currentPassword, record.passwordHash);
  if (!valid) return { error: "Your current password is incorrect." };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash } }),
    db.session.deleteMany({ where: { userId: user.id } }),
  ]);

  const fingerprint = await clientFingerprint();
  await createSession(user.id, { ipHash: fingerprint });
  await audit({
    actorId: user.id,
    action: "auth.password_changed",
    entityType: "User",
    entityId: user.id,
    ipHash: fingerprint,
  });

  return { success: "Password changed. Other sessions were signed out." };
}

export async function deleteAccountAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/account");
  const parsed = deleteAccountSchema.safeParse({
    password: readString(formData, "password"),
    confirmation: readString(formData, "confirmation"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Confirmation did not match." };
  }

  const record = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record) return { error: "Account not found." };
  if (!(await verifyPassword(parsed.data.password, record.passwordHash))) {
    return { error: "Password is incorrect." };
  }

  await audit({
    actorId: null,
    action: "account.delete",
    entityType: "User",
    entityId: user.id,
  });

  await db.user.delete({ where: { id: user.id } });
  redirect("/?deleted=1");
}
