import { db } from "@edubuf/database";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json(
      { error: "Sign in to download your data." },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  const [account, profile, notifications, preferences, consents, sessions] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    }),
    db.studentProfile.findUnique({
      where: { userId: user.id },
      include: {
        nationality: { select: { iso2: true, name: true } },
        countryOfResidence: { select: { iso2: true, name: true } },
        intendedSubject: { select: { code: true, name: true } },
        preferredDestinations: {
          orderBy: { priority: "asc" },
          include: { country: { select: { iso2: true, name: true } } },
        },
        qualifications: {
          include: {
            qualificationType: { select: { code: true, name: true, level: true } },
            awardingBody: { select: { code: true, name: true } },
            gradeScale: { select: { code: true, name: true } },
            subjectResults: { include: { subject: { select: { code: true, name: true } } } },
          },
          orderBy: { createdAt: "asc" },
        },
        languageQualifications: { orderBy: { createdAt: "asc" } },
        savedOpportunities: {
          include: {
            university: { select: { slug: true, name: true } },
            programme: { select: { slug: true, title: true } },
            scholarship: { select: { slug: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        applications: {
          include: {
            programme: { select: { slug: true, title: true } },
            scholarship: { select: { slug: true, name: true } },
            notes: { orderBy: { createdAt: "asc" } },
            tasks: { orderBy: { dueAt: "asc" } },
            documents: {
              select: {
                label: true,
                fileName: true,
                mimeType: true,
                sizeBytes: true,
                uploadedAt: true,
                verificationStatus: true,
              },
            },
            statusHistory: { orderBy: { changedAt: "asc" } },
          },
          orderBy: { createdAt: "asc" },
        },
        budgetPlans: {
          include: {
            programme: { select: { slug: true, title: true } },
            items: { orderBy: { category: "asc" } },
          },
          orderBy: { createdAt: "asc" },
        },
        matchResults: {
          include: {
            programme: { select: { slug: true, title: true } },
            scholarship: { select: { slug: true, name: true } },
            requirementResults: true,
          },
          orderBy: { generatedAt: "asc" },
        },
      },
    }),
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    db.userPreference.findUnique({ where: { userId: user.id } }),
    db.consentRecord.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    db.session.findMany({
      where: { userId: user.id },
      select: { createdAt: true, lastUsedAt: true, expiresAt: true, userAgent: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const payload = {
    exportFormat: "edubuf.account-export.v1",
    exportedAt: new Date().toISOString(),
    account,
    profile,
    notifications,
    preferences,
    consents,
    sessions,
    exclusions: [
      "password hash",
      "session token hashes",
      "rate-limit counters",
      "audit log entries",
    ],
  };

  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="edubuf-export-${stamp}.json"`,
      "cache-control": "no-store",
    },
  });
}
