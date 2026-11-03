"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, Callout, Card } from "@edubuf/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("page-render-failed", { digest: error.digest });
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 py-10">
      <Card>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">something broke</p>
        <h1 className="mt-1 font-display text-3xl text-ink">This page could not be loaded</h1>
        <p className="mt-2 text-sm text-ink-soft">
          The failure was logged without your personal content. If the database is unreachable, every page
          that needs it will fail the same way until it is back.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-ink-soft">reference: {error.digest}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Link
            href="/"
            className="inline-flex items-center rounded-md border border-ink/25 px-4 py-2 text-sm text-ink hover:border-ink/50"
          >
            Go home
          </Link>
        </div>
      </Card>

      <Callout tone="info" title="If this keeps happening">
        Check that the deployment has a reachable PostgreSQL database and a valid DATABASE_URL. The health
        endpoint at /api/health reports which dependencies are configured, without exposing any values.
      </Callout>
    </div>
  );
}
