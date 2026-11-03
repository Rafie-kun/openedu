import type { Metadata } from "next";
import { Badge, Card, EmptyState, LinkButton, SectionHeading } from "@openedu/ui";
import { db } from "@openedu/database";
import { requireUser } from "@/lib/session";
import { getOrCreateProfile } from "@/lib/student";
import { SaveForm } from "@/components/save-form";

export const metadata: Metadata = { title: "Saved" };
export const dynamic = "force-dynamic";

const KIND_LABELS = {
  UNIVERSITY: "University",
  PROGRAMME: "Programme",
  SCHOLARSHIP: "Scholarship",
} as const;

export default async function SavedPage() {
  const user = await requireUser("/saved");
  const profile = await getOrCreateProfile(user.id);

  const saved = await db.savedOpportunity.findMany({
    where: { profileId: profile.id },
    include: {
      university: { include: { country: true } },
      programme: { include: { university: true } },
      scholarship: { include: { provider: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const counts = {
    UNIVERSITY: saved.filter((item) => item.kind === "UNIVERSITY").length,
    PROGRAMME: saved.filter((item) => item.kind === "PROGRAMME").length,
    SCHOLARSHIP: saved.filter((item) => item.kind === "SCHOLARSHIP").length,
  };

  return (
    <div>
      <SectionHeading
        eyebrow="workspace"
        title="Saved opportunities"
        actions={
          <div className="flex gap-1.5">
            <Badge>{counts.UNIVERSITY} universities</Badge>
            <Badge>{counts.PROGRAMME} programmes</Badge>
            <Badge>{counts.SCHOLARSHIP} scholarships</Badge>
          </div>
        }
      >
        A saved record keeps its own check date. When its source is rechecked or a deadline changes, the
        record here is what gets flagged — not your memory of it.
      </SectionHeading>

      {saved.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          action={
            <>
              <LinkButton href="/programmes" size="sm">
                Browse programmes
              </LinkButton>
              <LinkButton href="/scholarships" variant="secondary" size="sm">
                Browse scholarships
              </LinkButton>
            </>
          }
        >
          Saving is a bookmark, not an application. Nothing is sent to an institution when you save a
          record.
        </EmptyState>
      ) : (
        <ul className="mt-2 space-y-3">
          {saved.map((item) => {
            let title = "Saved record";
            let subtitle = "";
            let href = "/dashboard";
            let targetId = "";
            let detail: string | null = null;

            if (item.kind === "UNIVERSITY" && item.university) {
              title = item.university.name;
              subtitle = `${item.university.city}, ${item.university.country.name}`;
              href = `/universities/${item.university.slug}`;
              targetId = item.university.id;
            } else if (item.kind === "PROGRAMME" && item.programme) {
              title = item.programme.title;
              subtitle = item.programme.university.name;
              href = `/programmes/${item.programme.slug}`;
              targetId = item.programme.id;
              detail = item.programme.degreeLevel.replaceAll("_", " ").toLowerCase();
            } else if (item.kind === "SCHOLARSHIP" && item.scholarship) {
              title = item.scholarship.name;
              subtitle = item.scholarship.provider.name;
              href = `/scholarships/${item.scholarship.slug}`;
              targetId = item.scholarship.id;
            }

            return (
              <Card as="li" key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    {KIND_LABELS[item.kind]}
                    {detail ? ` · ${detail}` : ""}
                  </p>
                  <a href={href} className="font-display text-lg text-ink hover:underline">
                    {title}
                  </a>
                  <p className="text-xs text-ink-soft">{subtitle}</p>
                </div>
                <SaveForm kind={item.kind} targetId={targetId} saved returnTo="/saved" />
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
