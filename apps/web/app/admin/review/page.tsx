import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@openedu/database";
import { formatDateTime } from "@openedu/shared";
import { Badge, Card, EmptyState, SectionHeading } from "@openedu/ui";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Review queue" };
export const dynamic = "force-dynamic";

export default async function ReviewQueuePage() {
  await requireAdmin();

  const items = await db.reviewQueueItem.findMany({
    where: { status: { in: ["OPEN", "IN_REVIEW"] } },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: 100,
  });

  return (
    <div>
      <SectionHeading eyebrow="review" title="Open items">
        Each item points at one source record. Approving a candidate adds an unverified institution;
        everything else in that record still needs a human.
      </SectionHeading>

      {items.length === 0 ? (
        <EmptyState title="Nothing waiting">
          The ingestion worker has not produced anything new, or every item has been dealt with.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <Card as="li" key={item.id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">{item.reason}</p>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
                    {item.entityType.toLowerCase()} · opened {formatDateTime(item.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={item.priority > 0 ? "warning" : "info"}>
                    priority {item.priority}
                  </Badge>
                  <Link href={`/admin/review/${item.id}`} className="quiet-link text-sm">
                    Open
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
