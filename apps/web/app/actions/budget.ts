"use server";

import { db } from "@openedu/database";
import { budgetItemSchema, budgetPlanSchema } from "@openedu/validation";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/session";
import { readString, type FormState } from "@/lib/forms";

async function profileIdFor(userId: string) {
  const profile = await db.studentProfile.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });
  return profile.id;
}

async function ownedPlanId(profileId: string, planId: string): Promise<string | null> {
  if (!planId) return null;
  const plan = await db.budgetPlan.findFirst({
    where: { id: planId, profileId },
    select: { id: true },
  });
  return plan?.id ?? null;
}

export async function createBudgetPlanAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/budget");
  const parsed = budgetPlanSchema.safeParse({
    title: readString(formData, "title"),
    targetCountryId: readString(formData, "targetCountryId"),
    currencyCode: readString(formData, "currencyCode").toUpperCase(),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the plan details." };
  }

  if (parsed.data.targetCountryId) {
    const country = await db.country.findUnique({
      where: { id: parsed.data.targetCountryId },
      select: { id: true },
    });
    if (!country) return { error: "That country is not in the reference list." };
  }

  const profileId = await profileIdFor(user.id);
  const plan = await db.budgetPlan.create({
    data: {
      profileId,
      title: parsed.data.title,
      currencyCode: parsed.data.currencyCode,
      targetCountryId: parsed.data.targetCountryId || null,
    },
    select: { id: true },
  });

  await audit({
    actorId: user.id,
    action: "budget.plan.create",
    entityType: "BudgetPlan",
    entityId: plan.id,
  });

  revalidatePath("/budget");
  return { success: "Plan created." };
}

export async function addBudgetItemAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/budget");
  const planId = readString(formData, "budgetPlanId");
  const parsed = budgetItemSchema.safeParse({
    category: readString(formData, "category"),
    label: readString(formData, "label"),
    amount: readString(formData, "amount"),
    currencyCode: readString(formData, "currencyCode").toUpperCase(),
    frequency: readString(formData, "frequency"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the cost details." };
  }

  const profileId = await profileIdFor(user.id);
  const owned = await ownedPlanId(profileId, planId);
  if (!owned) return { error: "That plan does not belong to this account." };

  await db.budgetItem.create({
    data: {
      budgetPlanId: owned,
      category: parsed.data.category,
      label: parsed.data.label,
      amount: parsed.data.amount,
      currencyCode: parsed.data.currencyCode,
      frequency: parsed.data.frequency,
      isUserEntered: true,
    },
  });

  revalidatePath("/budget");
  return { success: "Cost added." };
}

export async function copyCostEstimateAction(formData: FormData): Promise<void> {
  const user = await requireUser("/budget");
  const planId = readString(formData, "budgetPlanId");
  const estimateId = readString(formData, "estimateId");

  const profileId = await profileIdFor(user.id);
  const owned = await ownedPlanId(profileId, planId);
  if (!owned || !estimateId) return;

  const estimate = await db.costEstimate.findFirst({
    where: { id: estimateId, verificationStatus: { not: "ARCHIVED" } },
    include: { country: { select: { name: true } } },
  });
  if (!estimate) return;

  const frequency =
    estimate.period.toUpperCase() === "MONTH"
      ? "MONTHLY"
      : estimate.period.toUpperCase() === "YEAR"
        ? "YEARLY"
        : "ONE_TIME";

  await db.budgetItem.create({
    data: {
      budgetPlanId: owned,
      category: estimate.category,
      label: `${estimate.category.toLowerCase().replaceAll("_", " ")} · ${estimate.city ?? estimate.country.name}`,
      amount: estimate.amount,
      currencyCode: estimate.currencyCode,
      frequency,
      isUserEntered: false,
      sourceName: estimate.sourceUrl,
    },
  });

  revalidatePath("/budget");
}

export async function deleteBudgetItemAction(formData: FormData): Promise<void> {
  const user = await requireUser("/budget");
  const itemId = readString(formData, "itemId");
  const planId = readString(formData, "budgetPlanId");
  if (!itemId || !planId) return;

  const profileId = await profileIdFor(user.id);
  const owned = await ownedPlanId(profileId, planId);
  if (!owned) return;

  await db.budgetItem.deleteMany({ where: { id: itemId, budgetPlanId: owned } });
  revalidatePath("/budget");
}

export async function deleteBudgetPlanAction(formData: FormData): Promise<void> {
  const user = await requireUser("/budget");
  const planId = readString(formData, "budgetPlanId");
  if (!planId) return;

  const profileId = await profileIdFor(user.id);
  const owned = await ownedPlanId(profileId, planId);
  if (!owned) return;

  await db.budgetPlan.delete({ where: { id: owned } });
  await audit({
    actorId: user.id,
    action: "budget.plan.delete",
    entityType: "BudgetPlan",
    entityId: owned,
  });

  revalidatePath("/budget");
}
