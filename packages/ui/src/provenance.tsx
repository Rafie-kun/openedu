import type { ReactNode } from "react";
import { Badge, Callout, Card } from "./primitives";

type VerificationStatus =
  | "UNVERIFIED"
  | "PARTIALLY_VERIFIED"
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "CONFLICTING"
  | "STALE"
  | "ARCHIVED";

const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  UNVERIFIED: "Not verified",
  PARTIALLY_VERIFIED: "Partly verified",
  PENDING_REVIEW: "Pending review",
  VERIFIED: "Verified",
  CONFLICTING: "Sources conflict",
  STALE: "Possibly out of date",
  ARCHIVED: "Archived",
};

const VERIFICATION_TONE: Record<
  VerificationStatus,
  "neutral" | "info" | "success" | "warning" | "error"
> = {
  UNVERIFIED: "neutral",
  PARTIALLY_VERIFIED: "info",
  PENDING_REVIEW: "warning",
  VERIFIED: "success",
  CONFLICTING: "warning",
  STALE: "warning",
  ARCHIVED: "neutral",
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return <Badge tone={VERIFICATION_TONE[status]}>{VERIFICATION_LABELS[status]}</Badge>;
}

export function Provenance({
  status,
  sourceUrl,
  lastCheckedAt,
  note,
}: {
  status: VerificationStatus;
  sourceUrl: string | null;
  lastCheckedAt: Date | string | null;
  note?: string;
}) {
  const checked =
    lastCheckedAt === null
      ? "never checked"
      : new Date(lastCheckedAt).toISOString().slice(0, 10);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
      <VerificationBadge status={status} />
      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="underline underline-offset-2 hover:text-ink"
        >
          Official source
        </a>
      ) : (
        <span>No source recorded</span>
      )}
      <span className="font-mono">checked {checked}</span>
      {note ? <span>{note}</span> : null}
    </div>
  );
}

export function DisclaimerCard({ children }: { children?: ReactNode }) {
  return (
    <Callout tone="warning" title="What this result means">
      {children ?? (
        <p>
          EduBuf compares your recorded profile with requirements the platform has collected. It
          cannot see your full application, cannot make an admissions or funding decision, and does
          not replace the official provider. Always confirm on the official page before you rely on
          a deadline, fee, requirement or visa rule.
        </p>
      )}
    </Callout>
  );
}

export function InsightCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card>
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">{title}</p>
      <div className="mt-2 text-sm text-ink">{children}</div>
      {footer ? <div className="mt-3 border-t border-line pt-3 text-xs text-ink-soft">{footer}</div> : null}
    </Card>
  );
}
