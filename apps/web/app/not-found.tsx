import Link from "next/link";
import { LinkButton, Card } from "@edubuf/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 py-10">
      <Card>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">404</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Nothing is filed here</h1>
        <p className="mt-2 text-sm text-ink-soft">
          The link may be old, or the record may have been archived. Archived records are removed from
          public listings; they are not quietly replaced with something similar.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <LinkButton href="/universities">Browse universities</LinkButton>
          <LinkButton href="/scholarships" variant="secondary">
            Browse scholarships
          </LinkButton>
        </div>
      </Card>

      <p className="text-sm text-ink-soft">
        If you followed a link from within EduBuf, that is a bug.{" "}
        <Link href="/dashboard" className="quiet-link">
          Return to your workspace
        </Link>{" "}
        and try the search again.
      </p>
    </div>
  );
}
