import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, EmptyState, LinkButton, Provenance, Window } from "@edubuf/ui";
import { db } from "@edubuf/database";
import { getCurrentUser } from "@/lib/session";
import { SaveForm } from "@/components/save-form";
import { formatDate } from "@edubuf/shared";

export const dynamic = "force-dynamic";

async function loadUniversity(slug: string) {
  return db.university.findUnique({
    where: { slug },
    include: {
      country: true,
      aliases: true,
      campuses: { include: { country: true } },
      programmes: {
        orderBy: { title: "asc" },
        include: { degreeType: true },
      },
      scholarships: {
        where: { verificationStatus: { not: "ARCHIVED" } },
        orderBy: { name: "asc" },
        take: 6,
      },
      recognitions: true,
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const university = await loadUniversity(slug);
  if (!university) return { title: "University not found" };
  return {
    title: university.name,
    description: `${university.name} in ${university.city}, ${university.country.name}. Programmes, requirements and provenance in the EduBuf catalogue.`,
  };
}

export default async function UniversityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [university, user] = await Promise.all([loadUniversity(slug), getCurrentUser()]);
  if (!university) notFound();

  let saved = false;
  if (user) {
    const profile = await db.studentProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (profile) {
      const record = await db.savedOpportunity.findUnique({
        where: {
          profileId_targetKey: {
            profileId: profile.id,
            targetKey: `UNIVERSITY:${university.id}`,
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
            institution · {university.country.name}
          </p>
          <h1 className="mt-1 font-display text-3xl text-ink">{university.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {university.city}
            {university.region ? `, ${university.region}` : ""} · {university.type.toLowerCase()}
            {university.foundedYear ? ` · founded ${university.foundedYear}` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <a
            href={university.websiteUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="quiet-link text-sm"
          >
            Official website ↗
          </a>
          {user ? (
            <SaveForm kind="UNIVERSITY" targetId={university.id} saved={saved} returnTo={`/universities/${slug}`} />
          ) : null}
        </div>
      </div>

      <Provenance
        status={university.verificationStatus}
        sourceUrl={university.sourceUrl ?? university.websiteUrl}
        lastCheckedAt={university.lastCheckedAt}
        note="Inclusion is not an accreditation claim."
      />

      {university.description ? (
        <p className="max-w-3xl text-sm leading-relaxed text-ink">{university.description}</p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <section aria-labelledby="programmes-heading" className="space-y-3">
          <h2 id="programmes-heading" className="font-display text-2xl text-ink">
            Programmes
          </h2>
          {university.programmes.length === 0 ? (
            <EmptyState title="No programmes recorded">
              Programme-level requirements, fees and deadlines have not been collected for this
              institution yet.
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {university.programmes.map((programme) => (
                <Card as="li" key={programme.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg text-ink">
                        <Link href={`/programmes/${programme.slug}`} className="hover:underline">
                          {programme.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-ink-soft">
                        {programme.degreeType?.name ?? programme.degreeLevel.replaceAll("_", " ").toLowerCase()}
                        {programme.durationMonths ? ` · ${programme.durationMonths} months` : ""}
                        {programme.languageOfInstruction ? ` · ${programme.languageOfInstruction}` : ""}
                      </p>
                    </div>
                    <Badge tone={programme.verificationStatus === "VERIFIED" ? "success" : "neutral"}>
                      {programme.verificationStatus.replaceAll("_", " ").toLowerCase()}
                    </Badge>
                  </div>
                  <Link
                    href={`/programmes/${programme.slug}`}
                    className="mt-2 inline-block text-sm quiet-link"
                  >
                    Requirements and eligibility
                  </Link>
                </Card>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <Window title="institution facts" meta="from source">
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-soft">Official name</dt>
                <dd>{university.officialName ?? university.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-soft">Campuses</dt>
                <dd>
                  {university.campuses.length === 0
                    ? "Not recorded"
                    : university.campuses
                        .map((campus) => `${campus.name} (${campus.city})`)
                        .join("; ")}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-soft">International office</dt>
                <dd>
                  {university.internationalOfficeUrl ? (
                    <a
                      className="quiet-link"
                      href={university.internationalOfficeUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      Official page ↗
                    </a>
                  ) : (
                    "Not recorded"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-soft">Application route</dt>
                <dd>
                  {university.applicationUrl ? (
                    <a
                      className="quiet-link"
                      href={university.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      Institution application page ↗
                    </a>
                  ) : (
                    "Not recorded"
                  )}
                </dd>
              </div>
            </dl>
          </Window>

          <Window title="recognition" meta="evidence only">
            {university.recognitions.length === 0 ? (
              <p className="text-sm text-ink-soft">
                No recognition or accreditation evidence is recorded. EduBuf does not infer recognition
                from a university&apos;s presence in a research database.
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {university.recognitions.map((record) => (
                  <li key={record.id}>
                    <p className="font-medium text-ink">{record.recognitionType}</p>
                    <p className="text-xs text-ink-soft">
                      {record.authorityName} · checked {formatDate(record.lastCheckedAt)}
                    </p>
                    <a
                      href={record.referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="quiet-link text-xs"
                    >
                      Authority reference ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Window>

          <Window title="scholarships" meta="at this institution">
            {university.scholarships.length === 0 ? (
              <p className="text-sm text-ink-soft">No scholarships recorded for this institution.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {university.scholarships.map((scholarship) => (
                  <li key={scholarship.id}>
                    <Link href={`/scholarships/${scholarship.slug}`} className="quiet-link">
                      {scholarship.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Window>

          <LinkButton href="/universities" variant="secondary" size="sm">
            ← All universities
          </LinkButton>
        </aside>
      </div>

      {university.aliases.length > 0 ? (
        <p className="text-xs text-ink-soft">
          Also known as: {university.aliases.map((alias) => alias.name).join(", ")}
        </p>
      ) : null}
    </div>
  );
}
