import type { Metadata } from "next";
import { db } from "@openedu/database";
import { formatDateTime } from "@openedu/shared";
import { Badge, Card, EmptyState, SectionHeading } from "@openedu/ui";
import { setSourceActiveAction } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Sources" };
export const dynamic = "force-dynamic";

const ACCESS_LABELS: Record<string, string> = {
  API: "API",
  BULK_DOWNLOAD: "Bulk download",
  WEB_PAGE: "Web page",
  MANUAL: "Manual entry",
  PARTNER_FEED: "Partner feed",
};

const PERMISSION_LABELS: Record<string, string> = {
  UNKNOWN: "Unknown",
  PENDING: "Permission pending",
  APPROVED: "Use permitted",
  RESTRICTED: "Restricted",
  PROHIBITED: "Not permitted",
};

export default async function SourcesPage() {
  await requireAdmin();

  const sources = await db.dataSource.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: {
      runs: { orderBy: { startedAt: "desc" }, take: 3 },
      _count: { select: { records: true, changeLogs: true } },
    },
  });

  return (
    <div>
      <SectionHeading eyebrow="registry" title="Data sources">
        Every source is recorded before it is used. A permitted API, a bulk download and a page that
        forbids automated collection need different handling, and the worker may only read sources
        that are active here.
      </SectionHeading>

      {sources.length === 0 ? (
        <EmptyState title="No sources registered">
          The seed adds the initial source registry. If this is empty, run the database seed before
          starting an ingestion run.
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {sources.map((source) => (
            <Card as="li" key={source.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    {source.code} · {source.category.toLowerCase().replaceAll("_", " ")}
                  </p>
                  <h2 className="font-display text-xl text-ink">{source.name}</h2>
                  <p className="text-sm text-ink-soft">{source.organisation}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={source.isActive ? "success" : "neutral"}>
                    {source.isActive ? "active" : "inactive"}
                  </Badge>
                  <Badge
                    tone={
                      source.permissionStatus === "APPROVED"
                        ? "success"
                        : source.permissionStatus === "RESTRICTED" ||
                            source.permissionStatus === "PROHIBITED"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {PERMISSION_LABELS[source.permissionStatus] ?? source.permissionStatus}
                  </Badge>
                  <Badge>{ACCESS_LABELS[source.accessMethod] ?? source.accessMethod}</Badge>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-soft">Source URL</dt>
                  <dd>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="quiet-link break-all"
                    >
                      {source.url}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-soft">Terms</dt>
                  <dd>
                    {source.termsUrl ? (
                      <a
                        href={source.termsUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="quiet-link break-all"
                      >
                        {source.termsUrl}
                      </a>
                    ) : (
                      <span className="text-ink-soft">Not recorded</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-soft">Licence</dt>
                  <dd className="text-ink-soft">
                    {source.licenceSummary ?? "No licence note recorded."}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-soft">Collection</dt>
                  <dd className="text-ink-soft">
                    {source.bulkCollectionAllowed === null
                      ? "Bulk collection not assessed"
                      : source.bulkCollectionAllowed
                        ? "Bulk collection allowed"
                        : "Bulk collection not allowed"}
                    {source.attributionRequired ? " · attribution required" : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-soft">Last attempt</dt>
                  <dd className="text-ink-soft">
                    {source.lastAttemptedRunAt
                      ? formatDateTime(source.lastAttemptedRunAt)
                      : "Never run"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-soft">Last success</dt>
                  <dd className="text-ink-soft">
                    {source.lastSuccessfulRunAt
                      ? formatDateTime(source.lastSuccessfulRunAt)
                      : "Never succeeded"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-soft">Recheck every</dt>
                  <dd className="text-ink-soft">
                    {source.updateFrequencyHours
                      ? `${source.updateFrequencyHours} hours`
                      : "Not scheduled"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-soft">Records</dt>
                  <dd className="text-ink-soft">
                    {source._count.records} records · {source._count.changeLogs} changes
                  </dd>
                </div>
              </dl>

              {source.knownLimitations ? (
                <p className="mt-3 rounded-md border border-brass/40 bg-brass/10 px-3 py-2 text-sm text-ink-soft">
                  {source.knownLimitations}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                <form action={setSourceActiveAction}>
                  <input type="hidden" name="sourceId" value={source.id} />
                  <input type="hidden" name="isActive" value={source.isActive ? "false" : "true"} />
                  <button
                    type="submit"
                    className="rounded-md border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-ink/40 hover:text-ink"
                  >
                    {source.isActive ? "Disable runs" : "Enable runs"}
                  </button>
                </form>

                {source.runs.length > 0 ? (
                  <p className="text-xs text-ink-soft">
                    latest run {source.runs[0]!.status.toLowerCase()} ·{" "}
                    {formatDateTime(source.runs[0]!.startedAt)}
                  </p>
                ) : (
                  <p className="text-xs text-ink-soft">No runs recorded.</p>
                )}
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
