"use server";

import { Prisma, db } from "@openedu/database";
import { loginSchema, registerSchema } from "@openedu/validation";
import { redirect } from "next/navigation";
import { safeInternalPath } from "@openedu/shared";
import { audit } from "@/lib/audit";
import { hashIdentifier, hashPassword, verifyPassword } from "@/lib/crypto";
import { clientFingerprint, rateLimit } from "@/lib/rate-limit";
import { createSession, destroyCurrentSession, sessionPepper } from "@/lib/session";
import { readString, type FormState } from "@/lib/forms";

const CONSENT_VERSION = "2026-11-02";

async function emailBucket(email: string): Promise<string> {
  const pepper = sessionPepper();
  return hashIdentifier(email.toLowerCase(), pepper);
}

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = {
    displayName: readString(formData, "displayName"),
    email: readString(formData, "email"),
    password: readString(formData, "password"),
    acceptTerms: formData.get("acceptTerms") === "on",
    acceptPrivacy: formData.get("acceptPrivacy") === "on",
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Please check the highlighted fields.", fieldErrors };
  }

  const fingerprint = await clientFingerprint();
  const ipLimit = await rateLimit(`register:ip:${fingerprint}`, 5, 3600);
  if (!ipLimit.allowed) {
    return { error: "Too many attempts from this connection. Try again in an hour." };
  }
  const emailKey = await emailBucket(parsed.data.email);
  const emailLimit = await rateLimit(`register:email:${emailKey}`, 3, 3600);
  if (!emailLimit.allowed) {
    return { error: "Too many attempts for this address. Try again later." };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  let userId: string;
  try {
    userId = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: parsed.data.email,
          displayName: parsed.data.displayName,
          passwordHash,
          preferences: { create: {} },
          profile: { create: {} },
          consents: {
            create: [
              { kind: "TERMS", granted: true, version: CONSENT_VERSION },
              { kind: "PRIVACY", granted: true, version: CONSENT_VERSION },
            ],
          },
        },
        select: { id: true },
      });
      return user.id;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        error: "An account with that email already exists.",
        fieldErrors: { email: "Already registered" },
      };
    }
    console.error("registration-failed", error);
    return { error: "The account could not be created. Please try again." };
  }

  await createSession(userId, { ipHash: fingerprint });
  await audit({
    actorId: userId,
    action: "auth.register",
    entityType: "User",
    entityId: userId,
    ipHash: fingerprint,
  });

  redirect("/onboarding");
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: readString(formData, "email"),
    password: readString(formData, "password"),
    next: readString(formData, "next") || undefined,
  });

  if (!parsed.success) {
    return { error: "Enter a valid email address and password." };
  }

  const fingerprint = await clientFingerprint();
  const ipLimit = await rateLimit(`login:ip:${fingerprint}`, 20, 900);
  if (!ipLimit.allowed) {
    return { error: "Too many attempts. Wait a few minutes before trying again." };
  }
  const emailKey = await emailBucket(parsed.data.email);
  const emailLimit = await rateLimit(`login:email:${emailKey}`, 10, 900);
  if (!emailLimit.allowed) {
    return { error: "Too many attempts for this account. Wait a few minutes." };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const genericError = { error: "Email or password is incorrect." };

  if (!user || user.deletedAt) return genericError;

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    return { error: "This account is temporarily locked after repeated failed sign-ins." };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    const failedLoginCount = user.failedLoginCount + 1;
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount,
        lockedUntil:
          failedLoginCount >= 8 ? new Date(Date.now() + 15 * 60 * 1000) : user.lockedUntil,
      },
    });
    await audit({
      actorId: user.id,
      action: "auth.login_failed",
      entityType: "User",
      entityId: user.id,
      ipHash: fingerprint,
    });
    return genericError;
  }

  await db.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  await createSession(user.id, { ipHash: fingerprint });
  await audit({
    actorId: user.id,
    action: "auth.login",
    entityType: "User",
    entityId: user.id,
    ipHash: fingerprint,
  });

  redirect(safeInternalPath(parsed.data.next));
}

export async function logoutAction(): Promise<void> {
  await destroyCurrentSession();
  redirect("/");
}
