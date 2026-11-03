from __future__ import annotations

from datetime import datetime

from ..change_detection import content_hash, diff_payload
from ..http import Fetcher, SourceError
from ..models import RunCounts, RunSummary
from ..sources.base import SourceAdapter
from ..store import Store, utcnow
from ..validators import Severity, has_errors, validate_candidate

PAYLOAD_FIELDS = ("displayName", "city", "countryCode", "website", "types", "status")


def run_source(
    adapter: SourceAdapter,
    store: Store,
    fetcher: Fetcher,
    now: datetime | None = None,
) -> RunSummary:
    """Reads one source and records what is new, what changed and what needs a human."""
    started_at = now or utcnow()
    run_id = store.begin_run(adapter.code, started_at)
    counts = RunCounts()
    errors: list[str] = []

    for query in adapter.queries():
        try:
            items = adapter.fetch(query, fetcher)
        except SourceError as exc:
            errors.append(f"{query}: {exc}")
            continue

        for item in items:
            counts.seen += 1
            candidate = adapter.parse(item)
            if candidate is None:
                counts.rejected += 1
                errors.append(f"{query}: a record with no usable id or name")
                continue

            issues = validate_candidate(candidate)
            if has_errors(issues):
                counts.rejected += 1
                errors.append(f"{candidate.name}: " + "; ".join(str(issue) for issue in issues))
                continue
            warnings = [issue for issue in issues if issue.severity is Severity.WARNING]

            payload = candidate.payload
            digest = content_hash(payload)
            stored = store.find_record(adapter.code, candidate.external_id)

            if stored is None:
                record = store.insert_record(
                    source_code=adapter.code,
                    external_id=candidate.external_id,
                    entity_type=adapter.entity_type,
                    payload=payload,
                    content_hash=digest,
                    seen_at=started_at,
                )
                counts.created += 1
                store.queue_review(
                    record.id,
                    _reason("new candidate, confirm it belongs in the catalogue", warnings),
                    priority=0,
                    created_at=started_at,
                )
            elif stored.content_hash == digest:
                store.touch_record(stored.id, started_at)
                counts.unchanged += 1
            else:
                changes = diff_payload(stored.payload, payload, PAYLOAD_FIELDS)
                store.update_record(stored.id, payload, digest, started_at)
                store.append_changes(stored.id, adapter.code, changes, started_at)
                counts.updated += 1
                if changes:
                    fields = ", ".join(change.field for change in changes)
                    store.queue_review(
                        stored.id,
                        _reason(f"source values changed: {fields}", warnings),
                        priority=1,
                        created_at=started_at,
                    )

    status = _status(counts, errors)
    finished_at = utcnow()
    store.finish_run(
        run_id,
        status,
        counts,
        finished_at,
        "; ".join(errors) if errors else None,
    )

    return RunSummary(
        source_code=adapter.code,
        run_id=run_id,
        status=status,
        counts=counts,
        errors=errors,
        started_at=started_at,
        finished_at=finished_at,
    )


def _reason(base: str, warnings: list) -> str:
    if not warnings:
        return base
    detail = "; ".join(str(issue) for issue in warnings)
    return f"{base} ({detail})"


def _status(counts: RunCounts, errors: list[str]) -> str:
    if not errors:
        return "SUCCEEDED"
    if counts.seen == 0:
        return "FAILED"
    return "PARTIAL"
