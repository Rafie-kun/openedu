import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@openedu/database";
import { formatDateTime } from "@openedu/shared";
import { Callout, Card, EmptyState, SectionHeading, Stat } from "@openedu/ui";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Administration" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();

  const [openReviews, openChanges, activeSources, sources, recentRuns, unverified, verified] =
    await Promise.all([
      db.reviewQueueItem.count({ where: { status: { in: ["OPEN", "IN_REVIEW"] } } }),
      db.changeLog.count({ where: { reviewStatus: "OPEN" } }),
      db.dataSource.count({ where: { isActive: true } }),
      db.dataSource.count(),
      db.ingestionRun.findMany({
        orderBy: { startedAt: "desc" },
        take: 5,
        include: { dataSource: { select: { name: true } } },
      }),
      db.university.count({
        where: { verificationStatus: { in: ["UNVERIFIED", "PENDING_REVIEW"] } },
      }),
      db.university.count({ where: { verificationStatus: "VERIFIED" } }),
    ]);

  return (
    <div>
      <SectionHeading eyebrow="administration" title="What needs attention">
        Public catalogue data only. Student profiles, applications and documents are not reachable
        from here.
      </SectionHeading>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="open review items" value={openReviews} hint="Ingestion candidates waiting" />
        <Stat label="unreviewed changes" value={openChanges} hint="Source values that moved" />
        <Stat
          label="active sources"
          value={`${activeSources} / ${sources}`}
          hint="Enabled for runs"
        />
        <Stat
          label="institutions"
          value={`${unverified} unverified`}
          hint={`${verified} verified`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-lg text-ink">Review queue</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Nothing published by the ingestion worker reaches the catalogue on its own.
          </p>
          <p className="mt-3">
            <Link href="/admin/review" className="quiet-link text-sm">
              Open the queue ({openReviews})
            </Link>
          </p>
        </Card>

        <Card>
          <h2 className="font-display text-lg text-ink">Sources</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Permission status, licence notes and the last successful run for each registered source.
          </p>
          <p className="mt-3">
            <Link href="/admin/sources" className="quiet-link text-sm">
              Open the source registry
            </Link>
          </p>
        </Card>
      </div>

      <h2 className="mt-8 font-display text-xl text-ink">Recent ingestion runs</h2>
      {recentRuns.length === 0 ? (
        <EmptyState title="No runs yet">
          The worker has not been run against this database. From{" "}
          <code className="font-mono text-xs">workers/data-ingestion</code>, run{" "}
          <code className="font-mono text-xs">
            python -m openedu_ingest.cli run --source ROR --query &quot;...&quot;
          </code>
          .
        </EmptyState>
      ) : (
        <ul className="mt-3 space-y-2">
          {recentRuns.map((run) => (
            <li
              key={run.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-panel/70 px-3 py-2 text-sm"
            >
              <span className="text-ink">
                {run.dataSource.name} · {run.status.toLowerCase()}
              </span>
              <span className="text-ink-soft">
                seen {run.recordsSeen}, new {run.recordsCreated}, changed {run.recordsUpdated},
                rejected {run.recordsRejected} · {formatDateTime(run.startedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Callout tone="warning" className="mt-8" title="Not built yet">
        Editing a source record, verifying an institution from here and rolling back a change are
        not implemented. Approval and rejection only move the review item&apos;s status.
      </Callout>
    </div>
  );
}
