import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Callout, Card, EmptyState, SectionHeading } from "@edubuf/ui";
import { db } from "@edubuf/database";
import { Provenance } from "@edubuf/ui";
import { toVerificationStatus } from "@/lib/display";

export const metadata: Metadata = { title: "Alternative pathways" };
export const dynamic = "force-dynamic";

const PATHWAY_EXPLANATIONS: Array<{ title: string; body: string }> = [
  {
    title: "Foundation year",
    body: "An extra preparatory year at a university or affiliated college. It usually leads into year one of a degree at the same institution, but progression is often conditional on passing the foundation programme.",
  },
  {
    title: "International foundation year",
    body: "A foundation route designed for students whose school qualification is not accepted directly. It often bundles language support. Check whether the target university accepts the specific foundation provider.",
  },
  {
    title: "Diploma or associate degree",
    body: "A shorter qualification that can sometimes count toward a bachelor's degree. Credit transfer depends on the receiving institution and is rarely automatic.",
  },
  {
    title: "Transfer or bridging route",
    body: "Moving from one institution or system into another with some credit recognised. Ask for a written credit-transfer decision before you rely on it.",
  },
];

export default async function PathwaysPage() {
  const pathways = await db.programmePathway.findMany({
    where: { verificationStatus: { not: "ARCHIVED" } },
    include: {
      fromProgramme: { include: { university: { include: { country: true } } } },
    },
    orderBy: [{ pathwayType: "asc" }, { title: "asc" }],
    take: 100,
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="routes" title="Alternative pathways">
        Not meeting one requirement is not the end of the road. These routes are only listed when an
        institution has published them — and none of them is a guaranteed door into a degree.
      </SectionHeading>

      <Callout tone="warning" title="Read the progression condition, not the brochure">
        &quot;Progression available&quot; is weaker than &quot;guaranteed progression&quot;. Where a
        provider has not stated whether progression is guaranteed, this page says so instead of assuming
        it is.
      </Callout>

      {pathways.length === 0 ? (
        <>
          <EmptyState title="No institution-specific pathways recorded yet">
            The catalogue does not contain published foundation, diploma or transfer routes yet. Rather
            than invent them, here is what the categories mean and what to check on an institution&apos;s
            own pages.
          </EmptyState>

          <div className="grid gap-4 sm:grid-cols-2">
            {PATHWAY_EXPLANATIONS.map((item) => (
              <Card key={item.title} as="article">
                <h2 className="font-display text-lg text-ink">{item.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.body}</p>
              </Card>
            ))}
          </div>

          <Card>
            <h2 className="font-display text-lg text-ink">Questions worth asking an institution</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
              <li>Is this pathway open to my nationality and my qualification system?</li>
              <li>
                Is progression to the degree guaranteed on passing, or decided by a separate competitive
                application?
              </li>
              <li>What grade or score do I need in the pathway itself?</li>
              <li>Is the pathway&apos;s fee the same as the degree fee?</li>
              <li>Will the receiving university recognise the credits in writing?</li>
            </ul>
            <p className="mt-3 text-sm text-ink-soft">
              Start from the{" "}
              <Link href="/universities" className="quiet-link">
                university catalogue
              </Link>{" "}
              and follow the institution&apos;s own international admissions page.
            </p>
          </Card>
        </>
      ) : (
        <ul className="space-y-3">
          {pathways.map((pathway) => (
            <Card as="li" key={pathway.id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    {pathway.pathwayType.replaceAll("_", " ").toLowerCase()}
                  </p>
                  <h2 className="font-display text-lg text-ink">{pathway.title}</h2>
                  {pathway.fromProgramme ? (
                    <p className="text-xs text-ink-soft">
                      Leads toward{" "}
                      <Link href={`/programmes/${pathway.fromProgramme.slug}`} className="quiet-link">
                        {pathway.fromProgramme.title}
                      </Link>{" "}
                      at {pathway.fromProgramme.university.name}
                    </p>
                  ) : (
                    <p className="text-xs text-ink-soft">Not linked to a specific programme</p>
                  )}
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
                <p className="mt-1 text-sm text-ink">
                  Recorded grade condition: {pathway.gradeRequirement}
                </p>
              ) : null}
              {pathway.progressionNote ? (
                <p className="mt-1 text-xs text-ink-soft">{pathway.progressionNote}</p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <a
                  href={pathway.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="quiet-link text-sm"
                >
                  Official pathway page ↗
                </a>
                <Provenance
                  status={toVerificationStatus(pathway.verificationStatus)}
                  sourceUrl={pathway.sourceUrl}
                  lastCheckedAt={pathway.lastCheckedAt}
                />
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
