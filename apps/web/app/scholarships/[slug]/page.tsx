import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, EmptyState, LinkButton, Provenance, Window } from "@edubuf/ui";
import {
  DEGREE_LEVEL_LABELS,
  FUNDING_COMPONENT_LABELS,
  formatDate,
  formatMoney,
} from "@edubuf/shared";
import { db } from "@edubuf/database";
import { getCurrentUser } from "@/lib/session";
import { evaluateScholarshipForProfile } from "@/lib/eligibility";
import { EligibilityPanel } from "@/components/eligibility-panel";
import { SaveForm } from "@/components/save-form";
import { toVerificationStatus } from "@/lib/display";

export const dynamic = "force-dynamic";

const COVERAGE_LABELS: Record<string, string> = {
  FULL: "full",
  PARTIAL: "partial",
  FIXED_AMOUNT: "fixed amount",
  UNSPECIFIED: "not specified",
};

async function loadScholarship(slug: string) {
  return db.scholarship.findUnique({
    where: { slug },
    include: {
      provider: true,
      hostCountry: true,
      university: true,
      eligibilityRules: { orderBy: { createdAt: "asc" } },
      fundingComponents: true,
      deadlines: { orderBy: { closesAt: "asc" } },
      documentRequirements: true,
      applicationMethods: true,
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const scholarship = await loadScholarship(slug);
  if (!scholarship) return { title: "Scholarship not found" };
  return {
    title: scholarship.name,
    description: `Eligibility conditions, funding breakdown and source record for ${scholarship.name}, offered by ${scholarship.provider.name}.`,
  };
}

export default async function ScholarshipPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [scholarship, user] = await Promise.all([loadScholarship(slug), getCurrentUser()]);
  if (!scholarship) notFound();

  let evaluation = null;
  let saved = false;
  if (user) {
    const profile = await db.studentProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (profile) {
      evaluation = await evaluateScholarshipForProfile(profile.id, scholarship.id);
      const record = await db.savedOpportunity.findUnique({
        where: {
          profileId_targetKey: {
            profileId: profile.id,
            targetKey: `SCHOLARSHIP:${scholarship.id}`,
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
            funding · {scholarship.provider.name}
            {scholarship.hostCountry ? ` · ${scholarship.hostCountry.name}` : ""}
          </p>
          <h1 className="mt-1 font-display text-3xl text-ink">{scholarship.name}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge>{scholarship.provider.type.toLowerCase()}</Badge>
            {scholarship.degreeLevels.map((level) => (
              <Badge key={level} tone="info">
                {DEGREE_LEVEL_LABELS[level]}
              </Badge>
            ))}
            {scholarship.durationMonths ? (
              <Badge>{scholarship.durationMonths} months funded</Badge>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <a
            href={scholarship.officialUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="quiet-link text-sm"
          >
            Official scholarship page ↗
          </a>
          {user ? (
            <SaveForm
              kind="SCHOLARSHIP"
              targetId={scholarship.id}
              saved={saved}
              returnTo={`/scholarships/${slug}`}
            />
          ) : null}
        </div>
      </div>

      <Provenance
        status={toVerificationStatus(scholarship.verificationStatus)}
        sourceUrl={scholarship.sourceUrl ?? scholarship.officialUrl}
        lastCheckedAt={scholarship.lastCheckedAt}
        note="Eligibility rules and funding components are listed with their own provenance."
      />

      {scholarship.description ? (
        <p className="max-w-3xl text-sm leading-relaxed text-ink">{scholarship.description}</p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <EligibilityPanel
            evaluation={evaluation}
            opportunityKind="scholarship"
            signedIn={Boolean(user)}
          />

          <section aria-labelledby="funding-heading">
            <h2 id="funding-heading" className="font-display text-2xl text-ink">
              What the funding actually covers
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Every component is listed separately. &quot;Not specified&quot; means the provider did not
              state it — it does not mean it is included or excluded.
            </p>

            {scholarship.fundingComponents.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="No funding breakdown recorded">
                  The platform has the scholarship but not its components. Read the official page before
                  assuming anything is covered.
                </EmptyState>
              </div>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Funding components for {scholarship.name}</caption>
                  <thead>
                    <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-soft">
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Component
                      </th>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Coverage
                      </th>
                      <th scope="col" className="py-2 font-medium">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {scholarship.fundingComponents.map((component) => (
                      <tr key={component.id} className="border-b border-line/50 last:border-0">
                        <td className="py-2 pr-3">
                          {FUNDING_COMPONENT_LABELS[component.component]}
                          {component.description ? (
                            <span className="block text-xs text-ink-soft">{component.description}</span>
                          ) : null}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge tone={component.coverage === "UNSPECIFIED" ? "warning" : "success"}>
                            {COVERAGE_LABELS[component.coverage] ?? component.coverage.toLowerCase()}
                          </Badge>
                        </td>
                        <td className="py-2 font-mono text-xs">
                          {component.amount && component.currencyCode
                            ? formatMoney(component.amount, component.currencyCode)
                            : "Not stated"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section aria-labelledby="rules-heading">
            <h2 id="rules-heading" className="font-display text-2xl text-ink">
              Recorded eligibility conditions
            </h2>
            {scholarship.eligibilityRules.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="No eligibility conditions recorded">
                  Without recorded conditions the platform cannot check your eligibility. That is a data
                  gap, not an open door.
                </EmptyState>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {scholarship.eligibilityRules.map((rule) => (
                  <Card key={rule.id} className="py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-ink">{rule.label}</p>
                        <p className="mt-0.5 text-xs text-ink-soft">
                          {rule.kind.replaceAll("_", " ").toLowerCase()}
                          {rule.isMandatory ? " · mandatory" : " · optional"}
                          {rule.valueString ? ` · ${rule.valueString}` : ""}
                          {rule.minValue !== null ? ` · minimum ${rule.minValue}` : ""}
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

          {scholarship.documentRequirements.length > 0 ? (
            <section aria-labelledby="documents-heading">
              <h2 id="documents-heading" className="font-display text-2xl text-ink">
                Documents the provider asks for
              </h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-soft">
                {scholarship.documentRequirements.map((document) => (
                  <li key={document.id}>
                    {document.label}
                    {document.isMandatory ? "" : " (optional)"}
                    {document.notes ? ` — ${document.notes}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <Window title="deadlines" meta="provider dates">
            {scholarship.deadlines.length === 0 ? (
              <p className="text-sm text-ink-soft">
                No deadline recorded. A missing date is not an open call — confirm on the official page.
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {scholarship.deadlines.map((deadline) => (
                  <li key={deadline.id}>
                    <p className="font-medium text-ink">{deadline.label}</p>
                    <p className="text-xs text-ink-soft">
                      {deadline.opensAt ? `opens ${formatDate(deadline.opensAt)} · ` : ""}
                      {deadline.closesAt ? `closes ${formatDate(deadline.closesAt)}` : "closing date not recorded"}
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

          <Window title="how to apply" meta="provider process">
            {scholarship.applicationProcess ? (
              <p className="text-sm text-ink">{scholarship.applicationProcess}</p>
            ) : null}
            {scholarship.applicationMethods.length === 0 ? (
              <p className={scholarship.applicationProcess ? "mt-2 text-sm text-ink-soft" : "text-sm text-ink-soft"}>
                No application method recorded.
              </p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {scholarship.applicationMethods.map((method) => (
                  <li key={method.id}>
                    <p className="font-medium text-ink">{method.method}</p>
                    {method.instructions ? (
                      <p className="text-xs text-ink-soft">{method.instructions}</p>
                    ) : null}
                    {method.url ? (
                      <a
                        href={method.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="quiet-link text-xs"
                      >
                        Application link ↗
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Window>

          {scholarship.renewalConditions ? (
            <Window title="renewal" meta="conditions">
              <p className="text-sm text-ink">{scholarship.renewalConditions}</p>
            </Window>
          ) : null}

          <div className="space-y-2">
            {scholarship.applicationUrl ? (
              <LinkButton
                href={scholarship.applicationUrl}
                variant="secondary"
                size="sm"
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                Apply on the official page ↗
              </LinkButton>
            ) : null}
            {scholarship.university ? (
              <LinkButton href={`/universities/${scholarship.university.slug}`} variant="ghost" size="sm">
                About the institution
              </LinkButton>
            ) : null}
            <Link href="/scholarships" className="block text-sm quiet-link">
              ← All scholarships
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
