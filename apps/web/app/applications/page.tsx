import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, EmptyState, LinkButton, SectionHeading } from "@openedu/ui";
import { APPLICATION_STATUS_LABELS, daysUntil, formatDate, formatMoney } from "@openedu/shared";
import { db } from "@openedu/database";
import { requireUser } from "@/lib/session";
import { getOrCreateProfile } from "@/lib/student";

export const metadata: Metadata = { title: "Applications" };
export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const user = await requireUser("/applications");
  const profile = await getOrCreateProfile(user.id);

  const applications = await db.studentApplication.findMany({
    where: { profileId: profile.id },
    include: {
      programme: { include: { university: true } },
      scholarship: { include: { provider: true } },
      _count: { select: { notes: true, tasks: true } },
    },
    orderBy: [{ deadline: "asc" }, { updatedAt: "desc" }],
  });

  const openCount = applications.filter(
    (application) => !["REJECTED", "WITHDRAWN", "ENROLLED"].includes(application.status),
  ).length;

  return (
    <div>
      <SectionHeading
        eyebrow="workspace"
        title="Application tracker"
        actions={
          <LinkButton href="/applications/new" size="sm">
            Add an application
          </LinkButton>
        }
      >
        {applications.length === 0
          ? "Track what you are preparing, what you submitted and what came back."
          : `${openCount} open of ${applications.length} tracked. OpenEdu never submits, pays or signs anything for you.`}
      </SectionHeading>

      {applications.length === 0 ? (
        <EmptyState
          title="No applications tracked"
          action={
            <LinkButton href="/applications/new" size="sm">
              Add the first one
            </LinkButton>
          }
        >
          A tracker entry is a private note to yourself. It does not create an account with a university
          or a scholarship provider.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {applications.map((application) => {
            const days = daysUntil(application.deadline);
            const overdue = days !== null && days < 0;
            return (
              <Card as="li" key={application.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/applications/${application.id}`} className="font-display text-lg text-ink hover:underline">
                      {application.title}
                    </Link>
                    <p className="text-xs text-ink-soft">
                      {application.programme
                        ? `Programme · ${application.programme.university.name}`
                        : application.scholarship
                          ? `Scholarship · ${application.scholarship.provider.name}`
                          : "Custom entry"}
                    </p>
                  </div>
                  <Badge
                    tone={
                      application.status === "OFFER" || application.status === "ENROLLED"
                        ? "success"
                        : application.status === "REJECTED" || application.status === "WITHDRAWN"
                          ? "neutral"
                          : "info"
                    }
                  >
                    {APPLICATION_STATUS_LABELS[application.status]}
                  </Badge>
                </div>

                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-soft">
                  <div className="flex gap-1">
                    <dt>Deadline:</dt>
                    <dd className={overdue ? "font-medium text-blush" : ""}>
                      {application.deadline
                        ? `${formatDate(application.deadline)}${
                            overdue ? " · passed" : days !== null ? ` · ${days}d left` : ""
                          }`
                        : "not set"}
                    </dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>Fee:</dt>
                    <dd>
                      {application.feeAmount && application.feeCurrency
                        ? formatMoney(application.feeAmount, application.feeCurrency)
                        : "not recorded"}
                    </dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>Notes:</dt>
                    <dd>{application._count.notes}</dd>
                  </div>
                </dl>

                <Link href={`/applications/${application.id}`} className="mt-3 inline-block text-sm quiet-link">
                  Open tracker entry →
                </Link>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
