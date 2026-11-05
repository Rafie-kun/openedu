import { setCatalogueVerificationAction } from "@/app/actions/admin";

export function CatalogueVerificationButtons({
  entityType,
  entityId,
  status,
}: {
  entityType: string;
  entityId: string;
  status: string;
}) {
  const verified = status === "VERIFIED" || status === "PARTIALLY_VERIFIED";
  const archived = status === "ARCHIVED";

  return (
    <div className="flex flex-wrap gap-2">
      {!verified && !archived ? (
        <form action={setCatalogueVerificationAction}>
          <input type="hidden" name="entityType" value={entityType} />
          <input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="status" value="VERIFIED" />
          <button
            type="submit"
            className="rounded-md border border-sage/50 bg-sage/10 px-3 py-1.5 text-xs text-sage hover:border-sage"
          >
            Mark checked against source
          </button>
        </form>
      ) : null}

      {verified ? (
        <form action={setCatalogueVerificationAction}>
          <input type="hidden" name="entityType" value={entityType} />
          <input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="status" value="PENDING_REVIEW" />
          <button
            type="submit"
            className="rounded-md border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-ink/40 hover:text-ink"
          >
            Send back to review
          </button>
        </form>
      ) : null}

      {!archived ? (
        <form action={setCatalogueVerificationAction}>
          <input type="hidden" name="entityType" value={entityType} />
          <input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="status" value="ARCHIVED" />
          <button
            type="submit"
            className="rounded-md border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-blush hover:text-blush"
          >
            Archive
          </button>
        </form>
      ) : null}
    </div>
  );
}
