import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Callout, Card, EmptyState, Provenance, SectionHeading } from "@openedu/ui";
import { formatDate } from "@openedu/shared";
import { db } from "@openedu/database";
import { toVerificationStatus } from "@/lib/display";

export const metadata: Metadata = { title: "Student visas" };
export const dynamic = "force-dynamic";

const QUESTIONS = [
  "Which visa category covers a student on my course length, and does the course level change it?",
  "What proof of funds is accepted, for how many months, and held for how long before applying?",
  "Is a tuition deposit or full payment required before the visa application is filed?",
  "Which health insurance or medical checks apply, and do they differ by nationality?",
  "How many hours can I work during term, and does that change in holidays?",
  "Can dependants come with me, and on what conditions?",
  "How long after the course can I stay, and is that a separate application?",
];

export default async function VisasPage() {
  const categories = await db.visaCategory.findMany({
    where: { verificationStatus: { not: "ARCHIVED" } },
    include: {
      country: { select: { name: true, iso2: true } },
      requirements: { orderBy: [{ isMandatory: "desc" }, { label: "asc" }] },
      sources: { orderBy: { retrievedAt: "desc" } },
    },
    orderBy: [{ country: { name: "asc" } }, { name: "asc" }],
    take: 200,
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="destinations" title="Student visa centre">
        Student visa rules are written by governments, change without notice and differ by
        nationality. OpenEdu records them only from official immigration sources, with the date each
        requirement was checked.
      </SectionHeading>

      <Callout tone="warning" title="Not legal advice">
        This page cannot tell you whether you will be granted a visa. Requirements below are a
        record of what an official source said on a given date. Confirm on the government page
        before you pay for anything or book travel.
      </Callout>

      {categories.length === 0 ? (
        <>
          <EmptyState title="No verified visa records yet">
            The source registry exists, but no country&apos;s student visa category has been
            recorded and reviewed. Rather than publish an unchecked summary, the visa section stays
            empty until the first official source is logged.
          </EmptyState>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <h2 className="font-display text-lg text-ink">
                What will be recorded per destination
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
                <li>The exact visa category name and its official government page</li>
                <li>Mandatory and conditional requirements, each with its own source link</li>
                <li>Financial evidence thresholds as published, in the currency published</li>
                <li>Work rights, dependant rules and post-study options where officially stated</li>
                <li>Collection date, last check date and verification status</li>
              </ul>
              <p className="mt-3 text-sm text-ink-soft">
                Nothing here is inferred from a blog, an agent or another country&apos;s rules.
              </p>
            </Card>

            <Card>
              <h2 className="font-display text-lg text-ink">Ask the official source these</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
                {QUESTIONS.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </Card>
          </div>

          <p className="text-sm text-ink-soft">
            In the meantime, the{" "}
            <Link href="/universities" className="quiet-link">
              university catalogue
            </Link>{" "}
            links each institution&apos;s own international pages, which usually point to the
            correct government route.
          </p>
        </>
      ) : (
        <ul className="space-y-4">
          {categories.map((category) => (
            <Card as="li" key={category.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    {category.country.name}
                    {category.country.iso2 ? ` · ${category.country.iso2}` : ""}
                  </p>
                  <h2 className="font-display text-xl text-ink">{category.name}</h2>
                  <p className="font-mono text-xs text-ink-soft">{category.code}</p>
                  {category.description ? (
                    <p className="mt-2 text-sm text-ink-soft">{category.description}</p>
                  ) : null}
                </div>
                <Provenance
                  status={toVerificationStatus(category.verificationStatus)}
                  sourceUrl={category.officialUrl}
                  lastCheckedAt={category.lastCheckedAt}
                />
              </div>

              {category.requirements.length === 0 ? (
                <p className="mt-4 text-sm text-ink-soft">
                  No requirements recorded for this category yet.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-line/70">
                  {category.requirements.map((requirement) => (
                    <li key={requirement.id} className="py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={requirement.isMandatory ? "warning" : "neutral"}>
                          {requirement.isMandatory ? "mandatory" : "conditional"}
                        </Badge>
                        <p className="text-sm font-medium text-ink">{requirement.label}</p>
                      </div>
                      {requirement.detail ? (
                        <p className="mt-1 text-sm text-ink-soft">{requirement.detail}</p>
                      ) : null}
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-soft">
                        <span>
                          checked{" "}
                          {requirement.lastCheckedAt
                            ? formatDate(requirement.lastCheckedAt)
                            : "unknown"}
                        </span>
                        {requirement.effectiveFrom ? (
                          <span>in force from {formatDate(requirement.effectiveFrom)}</span>
                        ) : null}
                        {requirement.sourceUrl ? (
                          <a
                            href={requirement.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="quiet-link"
                          >
                            source ↗
                          </a>
                        ) : null}
                        <span className="font-mono uppercase tracking-[0.1em]">
                          {requirement.verificationStatus.toLowerCase().replaceAll("_", " ")}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                <a
                  href={category.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="quiet-link text-sm"
                >
                  Official government page ↗
                </a>
                {category.sources.length > 0 ? (
                  <p className="text-xs text-ink-soft">
                    {category.sources.length} recorded source
                    {category.sources.length === 1 ? "" : "s"}, latest{" "}
                    {formatDate(category.sources[0]!.retrievedAt)}
                  </p>
                ) : null}
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
