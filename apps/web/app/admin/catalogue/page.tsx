import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@openedu/database";
import {
  DEGREE_LEVEL_LABELS,
  VERIFICATION_LABELS,
  formatDate,
  verificationTone,
} from "@openedu/shared";
import type { DegreeLevelValue, VerificationStatusValue } from "@openedu/shared";
import { Badge, Callout, Card, EmptyState, SectionHeading, Window } from "@openedu/ui";
import { createProgrammeAction, createScholarshipAction } from "@/app/actions/admin";
import { ProgrammeForm, ScholarshipForm } from "@/components/catalogue-forms";
import { CatalogueVerificationButtons } from "@/components/catalogue-verification";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Catalogue records" };
export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const value = status as VerificationStatusValue;
  return <Badge tone={verificationTone(value)}>{VERIFICATION_LABELS[value] ?? status}</Badge>;
}

export default async function AdminCataloguePage() {
  await requireAdmin();

  const [universities, countries, programmes, scholarships] = await Promise.all([
    db.university.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.country.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.programme.findMany({
      include: { university: { select: { name: true, slug: true } } },
      orderBy: [{ verificationStatus: "asc" }, { updatedAt: "desc" }],
      take: 100,
    }),
    db.scholarship.findMany({
      include: {
        provider: { select: { name: true } },
        hostCountry: { select: { name: true } },
      },
      orderBy: [{ verificationStatus: "asc" }, { updatedAt: "desc" }],
      take: 100,
    }),
  ]);

  const pending =
    programmes.filter((row) => row.verificationStatus !== "VERIFIED").length +
    scholarships.filter((row) => row.verificationStatus !== "VERIFIED").length;

  return (
    <div>
      <SectionHeading
        eyebrow="catalogue"
        title="Programme and scholarship records"
        actions={<Badge tone={pending > 0 ? "warning" : "success"}>{pending} not verified</Badge>}
      >
        A record is entered from a page a person actually opened, with that page stored as the
        source. It starts in review because the entry itself is not a verification. Nothing here
        guesses a requirement, fee or deadline.
      </SectionHeading>

      <Callout tone="warning" title="Enter only what the source says">
        Leaving a field empty is correct when the page does not state it. Requirements, fees,
        deadlines and funding components each need their own record and their own source before
        eligibility can rely on them.
      </Callout>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Window title="new programme" meta="starts in review">
          <ProgrammeForm action={createProgrammeAction} universities={universities} />
        </Window>

        <Window title="new scholarship" meta="starts in review">
          <ScholarshipForm action={createScholarshipAction} countries={countries} />
        </Window>
      </div>

      <section aria-labelledby="programmes-heading" className="mt-10">
        <h2 id="programmes-heading" className="font-display text-2xl text-ink">
          Programmes
        </h2>

        {programmes.length === 0 ? (
          <EmptyState title="No programmes yet">
            The catalogue has no programme records. The public list stays empty until a real one is
            entered above.
          </EmptyState>
        ) : (
          <ul className="mt-3 space-y-3">
            {programmes.map((programme) => (
              <Card as="li" key={programme.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/programmes/${programme.slug}`}
                      className="text-sm font-medium text-ink hover:underline"
                    >
                      {programme.title}
                    </Link>
                    <p className="text-xs text-ink-soft">
                      {programme.university.name} ·{" "}
                      {DEGREE_LEVEL_LABELS[programme.degreeLevel as DegreeLevelValue] ??
                        programme.degreeLevel}
                      {programme.durationMonths ? ` · ${programme.durationMonths} months` : ""}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                      source{" "}
                      {programme.sourceUrl ? (
                        <a
                          href={programme.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="quiet-link break-all"
                        >
                          {programme.sourceUrl}
                        </a>
                      ) : (
                        "not recorded"
                      )}
                      {" · "}
                      {programme.lastCheckedAt
                        ? `checked ${formatDate(programme.lastCheckedAt)}`
                        : "never checked"}
                    </p>
                  </div>
                  <StatusBadge status={programme.verificationStatus} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/admin/catalogue/programme/${programme.id}`}
                    className="text-xs text-ink-soft underline underline-offset-2 hover:text-ink"
                  >
                    Requirements, fees and deadlines
                  </Link>
                  <CatalogueVerificationButtons
                    entityType="Programme"
                    entityId={programme.id}
                    status={programme.verificationStatus}
                  />
                </div>
              </Card>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="scholarships-heading" className="mt-10">
        <h2 id="scholarships-heading" className="font-display text-2xl text-ink">
          Scholarships
        </h2>

        {scholarships.length === 0 ? (
          <EmptyState title="No scholarships yet">
            The catalogue has no scholarship records. Nothing is seeded here on purpose.
          </EmptyState>
        ) : (
          <ul className="mt-3 space-y-3">
            {scholarships.map((scholarship) => (
              <Card as="li" key={scholarship.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/scholarships/${scholarship.slug}`}
                      className="text-sm font-medium text-ink hover:underline"
                    >
                      {scholarship.name}
                    </Link>
                    <p className="text-xs text-ink-soft">
                      {scholarship.provider.name}
                      {scholarship.hostCountry ? ` · ${scholarship.hostCountry.name}` : ""}
                      {scholarship.degreeLevels.length > 0
                        ? ` · ${scholarship.degreeLevels
                            .map((level) => DEGREE_LEVEL_LABELS[level as DegreeLevelValue] ?? level)
                            .join(", ")}`
                        : ""}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                      source{" "}
                      {scholarship.sourceUrl ? (
                        <a
                          href={scholarship.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="quiet-link break-all"
                        >
                          {scholarship.sourceUrl}
                        </a>
                      ) : (
                        "not recorded"
                      )}
                      {" · "}
                      {scholarship.lastCheckedAt
                        ? `checked ${formatDate(scholarship.lastCheckedAt)}`
                        : "never checked"}
                    </p>
                  </div>
                  <StatusBadge status={scholarship.verificationStatus} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/admin/catalogue/scholarship/${scholarship.id}`}
                    className="text-xs text-ink-soft underline underline-offset-2 hover:text-ink"
                  >
                    Eligibility, funding and deadlines
                  </Link>
                  <CatalogueVerificationButtons
                    entityType="Scholarship"
                    entityId={scholarship.id}
                    status={scholarship.verificationStatus}
                  />
                </div>
              </Card>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
