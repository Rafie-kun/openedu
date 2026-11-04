import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@openedu/database";
import { formatDateTime } from "@openedu/shared";
import { Badge, Callout, Card, SectionHeading, Window } from "@openedu/ui";
import {
  promoteCandidateAction,
  rejectReviewAction,
  resolveReviewAction,
} from "@/app/actions/admin";
import { PromoteCandidateForm, ReviewDecisionForm } from "@/components/admin-forms";
import { draftFromPayload } from "@/lib/candidates";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Review item" };
export const dynamic = "force-dynamic";

export default async function ReviewItemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const item = await db.reviewQueueItem.findUnique({ where: { id } });
  if (!item) notFound();

  const record = await db.sourceRecord.findUnique({
    where: { id: item.entityId },
    include: { dataSource: true },
  });
  const changes = record
    ? await db.changeLog.findMany({
        where: { sourceRecordId: record.id },
        orderBy: { changedAt: "desc" },
        take: 50,
      })
    : [];

  const isOpen = item.status === "OPEN" || item.status === "IN_REVIEW";
  const canPromote = isOpen && item.entityType === "UNIVERSITY_CANDIDATE" && record !== null;
  const draft = draftFromPayload(record?.payload as Record<string, unknown> | null);

  return (
    <div>
      <SectionHeading
        eyebrow={item.entityType.toLowerCase()}
        title={item.reason}
        actions={
          <Link href="/admin/review" className="quiet-link text-sm">
            ← Back to the queue
          </Link>
        }
      >
        Opened {formatDateTime(item.createdAt)}
        {item.resolvedAt ? `, closed ${formatDateTime(item.resolvedAt)}` : ""}. Status{" "}
        {item.status.toLowerCase()}.
      </SectionHeading>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Window
            title="source record"
            meta={record ? `${record.dataSource.name} · v${record.version}` : "missing"}
          >
            {record ? (
              <>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
                      external id
                    </dt>
                    <dd className="mt-1 break-all">
                      <a
                        href={record.externalId}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="quiet-link"
                      >
                        {record.externalId}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
                      seen
                    </dt>
                    <dd className="mt-1 text-ink">{formatDateTime(record.lastSeenAt)}</dd>
                  </div>
                </dl>
                <pre className="mt-4 max-h-80 overflow-auto rounded-md border border-line bg-paper/70 p-3 font-mono text-[11px] leading-relaxed text-ink-soft">
                  {JSON.stringify(record.payload, null, 2)}
                </pre>
              </>
            ) : (
              <p className="text-sm text-ink-soft">
                The source record this item points at no longer exists.
              </p>
            )}
          </Window>

          <Card>
            <h2 className="font-display text-lg text-ink">Field changes</h2>
            {changes.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">
                No field-level changes recorded. This is a first sighting.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {changes.map((change) => (
                  <li
                    key={change.id}
                    className="rounded-md border border-line bg-paper/60 px-3 py-2"
                  >
                    <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
                      {change.field} · {formatDateTime(change.changedAt)}
                    </p>
                    <p className="mt-1 text-ink">
                      <span className="text-ink-soft line-through">
                        {change.oldValue ?? "empty"}
                      </span>{" "}
                      → {change.newValue ?? "empty"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {canPromote ? (
            <Card>
              <h2 className="font-display text-lg text-ink">Add as an institution</h2>
              <p className="mt-1 mb-4 text-sm text-ink-soft">
                Only the name, city and website are checked here. The record is created unverified
                with the source link attached.
              </p>
              <PromoteCandidateForm
                action={promoteCandidateAction}
                reviewId={item.id}
                draft={draft}
              />
            </Card>
          ) : (
            <Callout tone={isOpen ? "warning" : "neutral"} title="No promotion path">
              {isOpen
                ? "This item is not an institution candidate, so it can only be resolved or rejected."
                : "This item is already closed."}
            </Callout>
          )}

          {isOpen ? (
            <>
              <Card>
                <h2 className="font-display text-lg text-ink">Resolve without adding</h2>
                <p className="mt-1 mb-4 text-sm text-ink-soft">
                  Use this when the data was handled elsewhere, or the record was already covered.
                </p>
                <ReviewDecisionForm
                  action={resolveReviewAction}
                  reviewId={item.id}
                  label="Mark resolved"
                  placeholder="What did you do with it?"
                />
              </Card>

              <Card>
                <h2 className="font-display text-lg text-ink">Reject</h2>
                <p className="mt-1 mb-4 text-sm text-ink-soft">
                  Rejecting keeps the source record and its history, and stops the item coming back.
                </p>
                <ReviewDecisionForm
                  action={rejectReviewAction}
                  reviewId={item.id}
                  label="Reject"
                  variant="primary"
                  placeholder="Why is this not usable?"
                />
              </Card>
            </>
          ) : (
            <Card>
              <p className="flex items-center gap-2 text-sm text-ink">
                <Badge tone={item.status === "REJECTED" ? "error" : "success"}>
                  {item.status.toLowerCase()}
                </Badge>
                {item.resolutionNote ?? "No note was left."}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
