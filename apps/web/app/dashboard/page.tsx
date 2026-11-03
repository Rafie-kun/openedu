import type { Metadata } from "next";
import Link from "next/link";
import {
  Badge,
  Callout,
  Card,
  EmptyState,
  LinkButton,
  ProgressBar,
  Stat,
  Window,
} from "@edubuf/ui";
import { VerificationBadge } from "@edubuf/ui";
import { APPLICATION_STATUS_LABELS, daysUntil, formatDate, profileCompleteness } from "@edubuf/shared";
import { db } from "@edubuf/database";
import { requireUser } from "@/lib/session";
import { getOrCreateProfile } from "@/lib/student";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const profile = await getOrCreateProfile(user.id);

  const [qualifications, languageCount, savedCount, applications, notifications, programmes] =
    await Promise.all([
      db.studentQualification.count({ where: { profileId: profile.id } }),
      db.languageQualification.count({ where: { profileId: profile.id } }),
      db.savedOpportunity.count({ where: { profileId: profile.id } }),
      db.studentApplication.findMany({
        where: { profileId: profile.id },
        include: { programme: { include: { university: true } }, scholarship: true },
        orderBy: [{ deadline: "asc" }, { updatedAt: "desc" }],
        take: 5,
      }),
      db.notification.findMany({
        where: { userId: user.id, readAt: null },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      db.programme.findMany({
        where: {
          verificationStatus: { not: "ARCHIVED" },
          ...(profile.intendedDegreeLevel ? { degreeLevel: profile.intendedDegreeLevel } : {}),
        },
        include: { university: { include: { country: true } } },
        orderBy: [{ verificationStatus: "asc" }, { title: "asc" }],
        take: 4,
      }),
    ]);

  const completeness = profileCompleteness({
    nationalityCountryId: profile.nationalityCountryId,
    countryOfResidenceId: profile.countryOfResidenceId,
    intendedDegreeLevel: profile.intendedDegreeLevel,
    intendedSubjectId: profile.intendedSubjectId,
    preferredDestinationCount: profile.preferredDestinations.length,
    qualificationCount: qualifications,
    languageQualificationCount: languageCount,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">workspace</p>
          <h1 className="mt-1 font-display text-3xl text-ink">Good to see you, {user.displayName}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            One honest snapshot of where your planning stands. Nothing here is a prediction.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/qualifications" variant="secondary" size="sm">
            Add a qualification
          </LinkButton>
          <LinkButton href="/universities" size="sm">
            Explore universities
          </LinkButton>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <ProgressBar value={completeness.percent} label="Profile completeness" />
          <p className="mt-2 text-xs text-ink-soft">
            {completeness.completed} of {completeness.total} checks. Missing items are listed below.
          </p>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Qualifications" value={qualifications} />
          <Stat label="Saved" value={savedCount} />
          <Stat label="Applications" value={applications.length} hint="most recent" />
          <Stat label="Language tests" value={languageCount} />
        </div>
        <Card>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
            Unread notifications
          </p>
          {notifications.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">
              Nothing new. EduBuf only notifies you about saved items, deadlines and profile gaps you
              opted into.
            </p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <Link href={notification.link ?? "/dashboard"} className="quiet-link">
                    {notification.title}
                  </Link>
                  <p className="text-xs text-ink-soft">{notification.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {completeness.gaps.length > 0 ? (
        <section aria-labelledby="gaps-heading">
          <h2 id="gaps-heading" className="font-display text-2xl text-ink">
            What is still missing
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {completeness.gaps.map((gap) => (
              <div
                key={gap.key}
                className="rounded-md border border-line bg-panel/70 px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-ink">{gap.label}</p>
                  <Link href={gap.href} className="text-xs quiet-link">
                    Add
                  </Link>
                </div>
                <p className="mt-1 text-xs text-ink-soft">{gap.why}</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <Callout tone="success" title="Profile complete">
          Every check has something to work with. You can still change any answer without losing
          history.
        </Callout>
      )}

      <section aria-labelledby="applications-heading">
        <div className="flex items-end justify-between gap-3">
          <h2 id="applications-heading" className="font-display text-2xl text-ink">
            Applications and deadlines
          </h2>
          <Link href="/applications" className="quiet-link text-sm">
            Open tracker →
          </Link>
        </div>
        {applications.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="No applications tracked yet" action={<LinkButton href="/scholarships" size="sm">Find a scholarship</LinkButton>}>
              Track a programme or scholarship yourself — EduBuf never submits anything on your behalf.
            </EmptyState>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {applications.map((application) => {
              const days = daysUntil(application.deadline);
              return (
                <Card key={application.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{application.title}</p>
                    <p className="text-xs text-ink-soft">
                      {application.programme
                        ? `Programme · ${application.programme.university.name}`
                        : application.scholarship
                          ? "Scholarship"
                          : "Custom entry"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge tone="info">{APPLICATION_STATUS_LABELS[application.status]}</Badge>
                    <span className="font-mono text-ink-soft">
                      {application.deadline
                        ? `${formatDate(application.deadline)}${
                            days !== null && days >= 0 ? ` · ${days}d` : " · passed"
                          }`
                        : "no deadline set"}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="programmes-heading">
        <div className="flex items-end justify-between gap-3">
          <h2 id="programmes-heading" className="font-display text-2xl text-ink">
            Programmes to look at
          </h2>
          <Link href="/programmes" className="quiet-link text-sm">
            All programmes →
          </Link>
        </div>
        {programmes.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="Catalogue is empty">
              Seed or import institutions before recommendations can appear. Nothing is invented to fill
              this space.
            </EmptyState>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {programmes.map((programme) => (
              <Card key={programme.id} as="article">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg text-ink">{programme.title}</h3>
                    <p className="text-xs text-ink-soft">
                      {programme.university.name} · {programme.university.country.name}
                    </p>
                  </div>
                  <VerificationBadge status={programme.verificationStatus} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge>{programme.degreeLevel.replaceAll("_", " ").toLowerCase()}</Badge>
                  {programme.durationMonths ? <Badge>{programme.durationMonths} months</Badge> : null}
                  {programme.languageOfInstruction ? (
                    <Badge>{programme.languageOfInstruction}</Badge>
                  ) : null}
                </div>
                <Link
                  href={`/programmes/${programme.slug}`}
                  className="mt-3 inline-block text-sm quiet-link"
                >
                  Open requirement check
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Window title="a note on what changed" meta="transparency">
        <p className="text-sm text-ink-soft">
          When a saved record changes, the platform shows the change instead of quietly rewriting your
          understanding of it. If a source check goes stale, the next eligibility check will say so.
        </p>
      </Window>
    </div>
  );
}
