import type { Metadata } from "next";
import Link from "next/link";
import { Callout, Window } from "@openedu/ui";
import { db } from "@openedu/database";
import { createApplicationAction } from "@/app/actions/workspace";
import { NewApplicationForm } from "@/components/application-forms";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Add an application" };
export const dynamic = "force-dynamic";

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ programme?: string; scholarship?: string }>;
}) {
  await requireUser("/applications/new");
  const { programme, scholarship } = await searchParams;

  const [programmes, scholarships] = await Promise.all([
    db.programme.findMany({
      where: { verificationStatus: { not: "ARCHIVED" } },
      select: { id: true, title: true, university: { select: { name: true } } },
      orderBy: { title: "asc" },
      take: 200,
    }),
    db.scholarship.findMany({
      where: { verificationStatus: { not: "ARCHIVED" } },
      select: { id: true, name: true, provider: { select: { name: true } } },
      orderBy: { name: "asc" },
      take: 200,
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">workspace</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Add an application to track</h1>
        <p className="mt-2 text-sm text-ink-soft">
          This creates a private tracker entry only. The institution receives nothing, and no fee is
          paid.
        </p>
      </div>

      <Callout tone="warning" title="Deadline honesty">
        Enter a deadline only if you have read it on an official page. If you are unsure, leave it
        blank — a guessed date is worse than no date, because it can make you rush or relax
        incorrectly.
      </Callout>

      <Window title="new tracker entry" meta="private to you">
        <NewApplicationForm
          action={createApplicationAction}
          defaultProgrammeId={programme ?? ""}
          defaultScholarshipId={scholarship ?? ""}
          programmes={programmes.map((item) => ({
            id: item.id,
            label: `${item.title} · ${item.university.name}`,
          }))}
          scholarships={scholarships.map((item) => ({
            id: item.id,
            label: `${item.name} · ${item.provider.name}`,
          }))}
        />
        {programmes.length === 0 && scholarships.length === 0 ? (
          <p className="mt-4 text-xs text-ink-soft">
            The catalogue has no programmes or scholarships yet, so you can still add a custom entry
            by title alone.
          </p>
        ) : null}
      </Window>

      <p className="text-sm text-ink-soft">
        <Link href="/applications" className="quiet-link">
          ← Back to the tracker
        </Link>
      </p>
    </div>
  );
}
