import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, EmptyState, LinkButton, Provenance, Window } from "@openedu/ui";
import { DEGREE_LEVEL_LABELS, formatDate, formatMoney } from "@openedu/shared";
import { db } from "@openedu/database";
import { getCurrentUser } from "@/lib/session";
import { evaluateProgrammeForProfile } from "@/lib/eligibility";
import { EligibilityPanel } from "@/components/eligibility-panel";
import { SaveForm } from "@/components/save-form";
import { toVerificationStatus } from "@/lib/display";

export const dynamic = "force-dynamic";

async function loadProgramme(slug: string) {
  return db.programme.findUnique({
    where: { slug },
    include: {
      university: { include: { country: true } },
      degreeType: true,
      subjects: { include: { subject: true } },
      admissionRequirements: {
        include: { qualificationType: true, subject: true, gradeScale: true },
        orderBy: { createdAt: "asc" },
      },
      languageRequirements: true,
      tuitionFees: true,
      deadlines: { orderBy: { closesAt: "asc" } },
      pathwaysFrom: { orderBy: { title: "asc" } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const programme = await loadProgramme(slug);
  if (!programme) return { title: "Programme not found" };
  return {
    title: `${programme.title} · ${programme.university.name}`,
    description: `Entry requirements, language conditions, fees and provenance for ${programme.title} at ${programme.university.name}.`,
  };
}

export default async function ProgrammePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [programme, user] = await Promise.all([loadProgramme(slug), getCurrentUser()]);
  if (!programme) notFound();

  let evaluation = null;
  let saved = false;
  if (user) {
    const profile = await db.studentProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (profile) {
      evaluation = await evaluateProgrammeForProfile(profile.id, programme.id);
      const record = await db.savedOpportunity.findUnique({
        where: {
          profileId_targetKey: {
            profileId: profile.id,
            targetKey: `PROGRAMME:${programme.id}`,
          },
        },
        select: { id: true },
      });
      saved = Boolean(record);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            <Link href={`/universities/${programme.university.slug}`} className="quiet-link">
              {programme.university.name}
            </Link>
            {" · "}
            {programme.university.country.name}
          </p>
          <h1 className="mt-1 font-display text-3xl text-ink">{programme.title}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge>{DEGREE_LEVEL_LABELS[programme.degreeLevel]}</Badge>
            {programme.degreeType ? <Badge>{programme.degreeType.name}</Badge> : null}
            {programme.durationMonths ? <Badge>{programme.durationMonths} months</Badge> : null}
            <Badge>{programme.deliveryMode.replaceAll("_", " ").toLowerCase()}</Badge>
            {programme.languageOfInstruction ? (
              <Badge>taught in {programme.languageOfInstruction}</Badge>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <a
            href={programme.officialUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="quiet-link text-sm"
          >
            Official programme page ↗
          </a>
          {user ? (
            <SaveForm
              kind="PROGRAMME"
              targetId={programme.id}
              saved={saved}
              returnTo={`/programmes/${slug}`}
            />
          ) : null}
        </div>
      </div>

      <Provenance
        status={toVerificationStatus(programme.verificationStatus)}
        sourceUrl={programme.sourceUrl ?? programme.officialUrl}
        lastCheckedAt={programme.lastCheckedAt}
        note="Requirements are listed individually below with their own source and check date."
      />

      {programme.description ? (
        <p className="max-w-3xl text-sm leading-relaxed text-ink">{programme.description}</p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <EligibilityPanel
            evaluation={evaluation}
            opportunityKind="programme"
            signedIn={Boolean(user)}
          />

          <section aria-labelledby="requirements-heading">
            <h2 id="requirements-heading" className="font-display text-2xl text-ink">
              Recorded entry requirements
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              These are the conditions the platform stores for this programme. The official page is
              always the authority.
            </p>

            {programme.admissionRequirements.length === 0 &&
            programme.languageRequirements.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="No requirement rows recorded">
                  The platform has the programme but not its entry conditions. This does not mean
                  there are none — read the official page.
                </EmptyState>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {programme.admissionRequirements.map((rule) => (
                  <Card key={rule.id} className="py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-ink">{rule.label}</p>
                        <p className="mt-0.5 text-xs text-ink-soft">
                          {rule.kind.replaceAll("_", " ").toLowerCase()}
                          {rule.isMandatory ? " · mandatory" : " · optional"}
                          {rule.subject ? ` · ${rule.subject.name}` : ""}
                          {rule.qualificationType ? ` · ${rule.qualificationType.name}` : ""}
                        </p>
                        {rule.minimumGradeLabel ? (
                          <p className="mt-1 text-sm text-ink">
                            Minimum {rule.minimumGradeLabel}
                            {rule.gradeScale ? ` on ${rule.gradeScale.name}` : ""}
                          </p>
                        ) : null}
                        {rule.description ? (
                          <p className="mt-1 text-sm text-ink-soft">{rule.description}</p>
                        ) : null}
                      </div>
                      <Provenance
                        status={toVerificationStatus(rule.verificationStatus)}
                        sourceUrl={rule.sourceUrl}
                        lastCheckedAt={rule.lastCheckedAt}
                      />
                    </div>
                  </Card>
                ))}

                {programme.languageRequirements.map((rule) => (
                  <Card key={rule.id} className="py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {rule.testCode} {rule.minimumScore}
                          {rule.scaleNote ? ` (${rule.scaleNote})` : ""}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-soft">
                          language test {rule.isMandatory ? "· mandatory" : "· optional"}
                        </p>
                      </div>
                      <Provenance
                        status={toVerificationStatus(rule.verificationStatus)}
                        sourceUrl={rule.sourceUrl}
                        lastCheckedAt={rule.lastCheckedAt}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {programme.pathwaysFrom.length > 0 ? (
            <section aria-labelledby="pathways-heading">
              <h2 id="pathways-heading" className="font-display text-2xl text-ink">
                Routes into this programme
              </h2>
              <ul className="mt-3 space-y-3">
                {programme.pathwaysFrom.map((pathway) => (
                  <Card as="li" key={pathway.id} className="py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-ink">{pathway.title}</p>
                        <p className="text-xs text-ink-soft">
                          {pathway.pathwayType.replaceAll("_", " ").toLowerCase()}
                          {pathway.durationMonths ? ` · ${pathway.durationMonths} months` : ""}
                        </p>
                      </div>
                      <Badge tone={pathway.progressionGuaranteed === true ? "success" : "warning"}>
                        {pathway.progressionGuaranteed === true
                          ? "documented progression"
                          : pathway.progressionGuaranteed === false
                            ? "progression not guaranteed"
                            : "progression not recorded"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-ink-soft">{pathway.description}</p>
                    {pathway.gradeRequirement ? (
                      <p className="mt-1 text-xs text-ink-soft">
                        Recorded grade condition: {pathway.gradeRequirement}
                      </p>
                    ) : null}
                    {pathway.progressionNote ? (
                      <p className="mt-1 text-xs text-ink-soft">{pathway.progressionNote}</p>
                    ) : null}
                    <a
                      href={pathway.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="mt-2 inline-block text-xs quiet-link"
                    >
                      Official pathway page ↗
                    </a>
                  </Card>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <Window title="costs" meta="from source">
            {programme.tuitionSummary ? (
              <p className="text-sm text-ink">{programme.tuitionSummary}</p>
            ) : null}
            {programme.tuitionFees.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">
                No tuition figure recorded. OpenEdu does not estimate a fee on the provider&apos;s
                behalf.
              </p>
            ) : (
              <ul className="mt-2 space-y-3 text-sm">
                {programme.tuitionFees.map((fee) => (
                  <li key={fee.id}>
                    <p className="font-mono text-ink">
                      {formatMoney(fee.amount, fee.currencyCode)} / {fee.period.toLowerCase()}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {fee.isInternational ? "international rate" : "domestic rate"}
                      {fee.notes ? ` · ${fee.notes}` : ""}
                    </p>
                    <Provenance
                      status={toVerificationStatus(fee.verificationStatus)}
                      sourceUrl={fee.sourceUrl}
                      lastCheckedAt={fee.lastCheckedAt}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Window>

          <Window title="deadlines" meta="intake dates">
            {programme.deadlines.length === 0 ? (
              <p className="text-sm text-ink-soft">
                No deadline recorded. Check the official page — a missing row is not an open
                deadline.
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {programme.deadlines.map((deadline) => (
                  <li key={deadline.id}>
                    <p className="font-medium text-ink">{deadline.label}</p>
                    <p className="text-xs text-ink-soft">
                      {deadline.intake ? `${deadline.intake} · ` : ""}
                      {deadline.closesAt
                        ? `closes ${formatDate(deadline.closesAt)}`
                        : "closing date not recorded"}
                      {` (${deadline.timezone})`}
                    </p>
                    <Provenance
                      status={toVerificationStatus(deadline.verificationStatus)}
                      sourceUrl={deadline.sourceUrl}
                      lastCheckedAt={deadline.lastCheckedAt}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Window>

          {programme.subjects.length > 0 ? (
            <Window title="subject classification" meta="programme">
              <ul className="flex flex-wrap gap-1.5">
                {programme.subjects.map((entry) => (
                  <li key={entry.subjectId}>
                    <Badge tone={entry.isPrimary ? "info" : "neutral"}>
                      {entry.subject.name}
                      {entry.isPrimary ? " · primary" : ""}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Window>
          ) : null}

          <div className="space-y-2">
            {programme.applicationUrl ? (
              <LinkButton
                href={programme.applicationUrl}
                variant="secondary"
                size="sm"
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                Institution application page ↗
              </LinkButton>
            ) : null}
            <LinkButton
              href={`/universities/${programme.university.slug}`}
              variant="ghost"
              size="sm"
            >
              ← About the institution
            </LinkButton>
          </div>
        </aside>
      </div>
    </div>
  );
}
