import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@openedu/database";
import {
  DEGREE_LEVEL_LABELS,
  FUNDING_COMPONENT_LABELS,
  REQUIREMENT_KIND_LABELS,
  VERIFICATION_LABELS,
  formatDate,
  formatMoney,
  verificationTone,
} from "@openedu/shared";
import type {
  DegreeLevelValue,
  RequirementKindValue,
  VerificationStatusValue,
} from "@openedu/shared";
import { Badge, Callout, Card, EmptyState, Provenance, Window } from "@openedu/ui";
import {
  createAdmissionRequirementAction,
  createLanguageRequirementAction,
  createProgrammeDeadlineAction,
  createScholarshipDeadlineAction,
  createScholarshipEligibilityRuleAction,
  createScholarshipFundingComponentAction,
  createTuitionFeeAction,
} from "@/app/actions/admin";
import {
  AdmissionRequirementForm,
  LanguageRequirementForm,
  ProgrammeDeadlineForm,
  ScholarshipDeadlineForm,
  ScholarshipEligibilityRuleForm,
  ScholarshipFundingForm,
  TuitionFeeForm,
} from "@/components/catalogue-child-forms";
import { CatalogueVerificationButtons } from "@/components/catalogue-verification";
import { toVerificationStatus } from "@/lib/display";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Catalogue record" };
export const dynamic = "force-dynamic";

const COVERAGE_LABELS: Record<string, string> = {
  FULL: "full",
  PARTIAL: "partial",
  FIXED_AMOUNT: "fixed amount",
  UNSPECIFIED: "not specified",
};

function StatusBadge({ status }: { status: string }) {
  const value = status as VerificationStatusValue;
  return <Badge tone={verificationTone(value)}>{VERIFICATION_LABELS[value] ?? status}</Badge>;
}

function SectionHeading({ id, title, note }: { id: string; title: string; note: string }) {
  return (
    <>
      <h2 id={id} className="font-display text-2xl text-ink">
        {title}
      </h2>
      <p className="mt-1 text-sm text-ink-soft">{note}</p>
    </>
  );
}

export default async function CatalogueRecordPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  await requireAdmin();
  const { kind, id } = await params;
  if (kind === "programme") return <ProgrammeRecord id={id} />;
  if (kind === "scholarship") return <ScholarshipRecord id={id} />;
  notFound();
}

async function ProgrammeRecord({ id }: { id: string }) {
  const [programme, qualificationTypes, subjects, gradeScales] = await Promise.all([
    db.programme.findUnique({
      where: { id },
      include: {
        university: { select: { name: true, slug: true } },
        admissionRequirements: {
          include: { qualificationType: true, subject: true, gradeScale: true },
          orderBy: { createdAt: "asc" },
        },
        languageRequirements: { orderBy: { createdAt: "asc" } },
        tuitionFees: { orderBy: { createdAt: "asc" } },
        deadlines: { orderBy: { closesAt: "asc" } },
      },
    }),
    db.qualificationType.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.subject.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.gradeScale.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!programme) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/catalogue"
          className="text-xs text-ink-soft underline underline-offset-2 hover:text-ink"
        >
          ← Catalogue
        </Link>
        <h1 className="mt-2 font-display text-3xl text-ink">{programme.title}</h1>
        <p className="text-sm text-ink-soft">
          {programme.university.name} ·{" "}
          {DEGREE_LEVEL_LABELS[programme.degreeLevel as DegreeLevelValue] ?? programme.degreeLevel}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <StatusBadge status={programme.verificationStatus} />
          <a
            href={programme.officialUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="quiet-link text-xs"
          >
            Official page ↗
          </a>
          <Link href={`/programmes/${programme.slug}`} className="quiet-link text-xs">
            Public page
          </Link>
        </div>
        <div className="mt-3">
          <CatalogueVerificationButtons
            entityType="Programme"
            entityId={programme.id}
            status={programme.verificationStatus}
          />
        </div>
      </div>

      <Callout tone="warning" title="Rows start unverified">
        Each condition, fee and deadline needs its own source. Until a row is marked checked, the
        matching engine tells the student to confirm it rather than treating it as met.
      </Callout>

      <section aria-labelledby="requirements-heading">
        <SectionHeading
          id="requirements-heading"
          title="Entry requirements"
          note="Only what an official page states. One row per condition."
        />

        {programme.admissionRequirements.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="No entry requirements recorded">
              The engine has nothing to compare for this programme yet.
            </EmptyState>
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {programme.admissionRequirements.map((rule) => (
              <Card as="li" key={rule.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{rule.label}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {REQUIREMENT_KIND_LABELS[rule.kind as RequirementKindValue] ?? rule.kind}
                      {rule.isMandatory ? " · mandatory" : " · optional"}
                      {rule.qualificationType ? ` · ${rule.qualificationType.name}` : ""}
                      {rule.subject ? ` · ${rule.subject.name}` : ""}
                    </p>
                    {rule.minimumGradeLabel ? (
                      <p className="mt-1 text-sm text-ink">
                        Minimum {rule.minimumGradeLabel}
                        {rule.gradeScale ? ` on ${rule.gradeScale.name}` : ""}
                        {rule.minimumGradeRank !== null ? ` (rank ${rule.minimumGradeRank})` : ""}
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
                <div className="mt-3">
                  <CatalogueVerificationButtons
                    entityType="AdmissionRequirement"
                    entityId={rule.id}
                    status={rule.verificationStatus}
                  />
                </div>
              </Card>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <Window title="add entry requirement" meta="starts in review">
            <AdmissionRequirementForm
              action={createAdmissionRequirementAction}
              programmeId={programme.id}
              qualificationTypes={qualificationTypes}
              subjects={subjects}
              gradeScales={gradeScales}
            />
          </Window>
        </div>
      </section>

      <section aria-labelledby="language-heading">
        <SectionHeading
          id="language-heading"
          title="Language conditions"
          note="One row per accepted test. A score copied from the page, not converted."
        />

        {programme.languageRequirements.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="No language conditions recorded" />
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {programme.languageRequirements.map((rule) => (
              <Card as="li" key={rule.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {rule.testCode} {rule.minimumScore}
                      {rule.scaleNote ? ` (${rule.scaleNote})` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {rule.isMandatory ? "mandatory" : "optional"}
                    </p>
                  </div>
                  <Provenance
                    status={toVerificationStatus(rule.verificationStatus)}
                    sourceUrl={rule.sourceUrl}
                    lastCheckedAt={rule.lastCheckedAt}
                  />
                </div>
                <div className="mt-3">
                  <CatalogueVerificationButtons
                    entityType="LanguageRequirement"
                    entityId={rule.id}
                    status={rule.verificationStatus}
                  />
                </div>
              </Card>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <Window title="add language condition" meta="starts in review">
            <LanguageRequirementForm
              action={createLanguageRequirementAction}
              programmeId={programme.id}
            />
          </Window>
        </div>
      </section>

      <section aria-labelledby="fees-heading">
        <SectionHeading
          id="fees-heading"
          title="Tuition fees"
          note="Record the figure the page publishes. An empty amount means the page gave no number."
        />

        {programme.tuitionFees.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="No tuition figures recorded" />
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {programme.tuitionFees.map((fee) => (
              <Card as="li" key={fee.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {formatMoney(fee.amount, fee.currencyCode)} / {fee.period.toLowerCase()}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {fee.isInternational ? "international rate" : "home rate"}
                    </p>
                    {fee.notes ? <p className="mt-1 text-sm text-ink-soft">{fee.notes}</p> : null}
                  </div>
                  <Provenance
                    status={toVerificationStatus(fee.verificationStatus)}
                    sourceUrl={fee.sourceUrl}
                    lastCheckedAt={fee.lastCheckedAt}
                  />
                </div>
                <div className="mt-3">
                  <CatalogueVerificationButtons
                    entityType="TuitionFee"
                    entityId={fee.id}
                    status={fee.verificationStatus}
                  />
                </div>
              </Card>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <Window title="add tuition fee" meta="starts in review">
            <TuitionFeeForm action={createTuitionFeeAction} programmeId={programme.id} />
          </Window>
        </div>
      </section>

      <section aria-labelledby="deadlines-heading">
        <SectionHeading
          id="deadlines-heading"
          title="Deadlines"
          note="Dates appear on /calendar. They carry their own verification badge there too."
        />

        {programme.deadlines.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="No deadlines recorded" />
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {programme.deadlines.map((deadline) => (
              <Card as="li" key={deadline.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {deadline.label}
                      {deadline.intake ? ` · ${deadline.intake}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {deadline.opensAt ? `opens ${formatDate(deadline.opensAt)} · ` : ""}
                      {deadline.closesAt
                        ? `closes ${formatDate(deadline.closesAt)}`
                        : "no close date"}
                      {" · "}
                      {deadline.timezone}
                    </p>
                  </div>
                  <Provenance
                    status={toVerificationStatus(deadline.verificationStatus)}
                    sourceUrl={deadline.sourceUrl}
                    lastCheckedAt={deadline.lastCheckedAt}
                  />
                </div>
                <div className="mt-3">
                  <CatalogueVerificationButtons
                    entityType="ProgrammeDeadline"
                    entityId={deadline.id}
                    status={deadline.verificationStatus}
                  />
                </div>
              </Card>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <Window title="add deadline" meta="starts in review">
            <ProgrammeDeadlineForm
              action={createProgrammeDeadlineAction}
              programmeId={programme.id}
            />
          </Window>
        </div>
      </section>
    </div>
  );
}

async function ScholarshipRecord({ id }: { id: string }) {
  const scholarship = await db.scholarship.findUnique({
    where: { id },
    include: {
      provider: true,
      hostCountry: true,
      eligibilityRules: { orderBy: { createdAt: "asc" } },
      fundingComponents: { orderBy: { component: "asc" } },
      deadlines: { orderBy: { closesAt: "asc" } },
    },
  });

  if (!scholarship) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/catalogue"
          className="text-xs text-ink-soft underline underline-offset-2 hover:text-ink"
        >
          ← Catalogue
        </Link>
        <h1 className="mt-2 font-display text-3xl text-ink">{scholarship.name}</h1>
        <p className="text-sm text-ink-soft">
          {scholarship.provider.name}
          {scholarship.hostCountry ? ` · ${scholarship.hostCountry.name}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <StatusBadge status={scholarship.verificationStatus} />
          <a
            href={scholarship.officialUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="quiet-link text-xs"
          >
            Official page ↗
          </a>
          <Link href={`/scholarships/${scholarship.slug}`} className="quiet-link text-xs">
            Public page
          </Link>
        </div>
        <div className="mt-3">
          <CatalogueVerificationButtons
            entityType="Scholarship"
            entityId={scholarship.id}
            status={scholarship.verificationStatus}
          />
        </div>
      </div>

      <Callout tone="warning" title="Rows start unverified">
        Eligibility rows feed the match result. Funding rows are shown as a breakdown, and a
        component left unspecified is displayed as unspecified rather than assumed covered.
      </Callout>

      <section aria-labelledby="eligibility-heading">
        <SectionHeading
          id="eligibility-heading"
          title="Eligibility conditions"
          note="One row per condition on the provider page."
        />

        {scholarship.eligibilityRules.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="No eligibility conditions recorded">
              The engine has nothing to compare for this scholarship yet.
            </EmptyState>
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {scholarship.eligibilityRules.map((rule) => (
              <Card as="li" key={rule.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{rule.label}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {REQUIREMENT_KIND_LABELS[rule.kind as RequirementKindValue] ?? rule.kind}
                      {rule.isMandatory ? " · mandatory" : " · optional"}
                    </p>
                    {rule.valueString ? (
                      <p className="mt-1 text-sm text-ink">Value: {rule.valueString}</p>
                    ) : null}
                    {rule.minValue !== null ? (
                      <p className="mt-1 text-sm text-ink">Minimum value: {rule.minValue}</p>
                    ) : null}
                  </div>
                  <Provenance
                    status={toVerificationStatus(rule.verificationStatus)}
                    sourceUrl={rule.sourceUrl}
                    lastCheckedAt={rule.lastCheckedAt}
                  />
                </div>
                <div className="mt-3">
                  <CatalogueVerificationButtons
                    entityType="ScholarshipEligibilityRule"
                    entityId={rule.id}
                    status={rule.verificationStatus}
                  />
                </div>
              </Card>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <Window title="add eligibility condition" meta="starts in review">
            <ScholarshipEligibilityRuleForm
              action={createScholarshipEligibilityRuleAction}
              scholarshipId={scholarship.id}
            />
          </Window>
        </div>
      </section>

      <section aria-labelledby="funding-heading">
        <SectionHeading
          id="funding-heading"
          title="Funding components"
          note="Each component is recorded separately. The page shows what the provider actually states."
        />

        {scholarship.fundingComponents.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="No funding breakdown recorded" />
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {scholarship.fundingComponents.map((component) => (
              <Card as="li" key={component.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {FUNDING_COMPONENT_LABELS[
                        component.component as keyof typeof FUNDING_COMPONENT_LABELS
                      ] ?? component.component}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {COVERAGE_LABELS[component.coverage] ?? component.coverage}
                      {component.amount !== null
                        ? ` · ${formatMoney(component.amount, component.currencyCode ?? "")}`
                        : ""}
                      {component.isSpecified ? " · stated by the source" : " · not stated"}
                    </p>
                    {component.description ? (
                      <p className="mt-1 text-sm text-ink-soft">{component.description}</p>
                    ) : null}
                    {component.sourceUrl ? (
                      <a
                        href={component.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="quiet-link mt-1 block text-xs"
                      >
                        {component.sourceUrl}
                      </a>
                    ) : null}
                  </div>
                  <StatusBadge status={component.verificationStatus} />
                </div>
                <div className="mt-3">
                  <CatalogueVerificationButtons
                    entityType="ScholarshipFundingComponent"
                    entityId={component.id}
                    status={component.verificationStatus}
                  />
                </div>
              </Card>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <Window title="add funding component" meta="one row per component">
            <ScholarshipFundingForm
              action={createScholarshipFundingComponentAction}
              scholarshipId={scholarship.id}
            />
          </Window>
        </div>
      </section>

      <section aria-labelledby="scholarship-deadlines-heading">
        <SectionHeading
          id="scholarship-deadlines-heading"
          title="Deadlines"
          note="Application windows, not award dates."
        />

        {scholarship.deadlines.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="No deadlines recorded" />
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {scholarship.deadlines.map((deadline) => (
              <Card as="li" key={deadline.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-ink">{deadline.label}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {deadline.opensAt ? `opens ${formatDate(deadline.opensAt)} · ` : ""}
                      {deadline.closesAt
                        ? `closes ${formatDate(deadline.closesAt)}`
                        : "no close date"}
                      {" · "}
                      {deadline.timezone}
                    </p>
                  </div>
                  <Provenance
                    status={toVerificationStatus(deadline.verificationStatus)}
                    sourceUrl={deadline.sourceUrl}
                    lastCheckedAt={deadline.lastCheckedAt}
                  />
                </div>
                <div className="mt-3">
                  <CatalogueVerificationButtons
                    entityType="ScholarshipDeadline"
                    entityId={deadline.id}
                    status={deadline.verificationStatus}
                  />
                </div>
              </Card>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <Window title="add deadline" meta="starts in review">
            <ScholarshipDeadlineForm
              action={createScholarshipDeadlineAction}
              scholarshipId={scholarship.id}
            />
          </Window>
        </div>
      </section>
    </div>
  );
}
