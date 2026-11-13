from __future__ import annotations

import json
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Protocol
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from .models import FieldChange, RunCounts, StoredRecord

# libpq refuses connection strings carrying options it does not know, and Prisma writes
# ?schema=public into the same variable
LIBPQ_OPTIONS = {"sslmode", "connect_timeout", "application_name", "target_session_attrs"}


def clean_dsn(dsn: str) -> str:
    parts = urlsplit(dsn)
    if not parts.query:
        return dsn
    kept = [(key, value) for key, value in parse_qsl(parts.query) if key in LIBPQ_OPTIONS]
    return urlunsplit(parts._replace(query=urlencode(kept)))


@dataclass(frozen=True)
class StoredReview:
    record_id: str
    reason: str


@dataclass(frozen=True)
class DuplicateMatch:
    kind: str  # "university" or "candidate"
    id: str
    name: str
    source_code: str | None  # None for a university, the owning source's code for a candidate

    def describe(self) -> str:
        if self.kind == "university":
            return f"university '{self.name}' ({self.id})"
        return f"{self.source_code} candidate '{self.name}' ({self.id})"


class Store(Protocol):
    def begin_run(self, source_code: str, started_at: datetime) -> str: ...

    def find_record(self, source_code: str, external_id: str) -> StoredRecord | None: ...

    def insert_record(
        self,
        source_code: str,
        external_id: str,
        entity_type: str,
        payload: dict,
        content_hash: str,
        seen_at: datetime,
    ) -> StoredRecord: ...

    def update_record(
        self,
        record_id: str,
        payload: dict,
        content_hash: str,
        seen_at: datetime,
    ) -> int: ...

    def touch_record(self, record_id: str, seen_at: datetime) -> None: ...

    def append_changes(
        self,
        record_id: str,
        source_code: str,
        changes: list[FieldChange],
        changed_at: datetime,
    ) -> None: ...

    def queue_review(self, record_id: str, reason: str, priority: int, created_at: datetime) -> None: ...

    def finish_run(
        self,
        run_id: str,
        status: str,
        counts: RunCounts,
        finished_at: datetime,
        error_summary: str | None,
    ) -> None: ...

    def find_possible_duplicates(
        self,
        domain: str | None,
        name: str,
        country_code: str | None,
        exclude_source_code: str,
        exclude_external_id: str,
    ) -> list[DuplicateMatch]: ...


@dataclass
class InMemoryStore:
    """Enough of the database to exercise the pipeline without one."""

    records: dict[tuple[str, str], StoredRecord] = field(default_factory=dict)
    changes: list[FieldChange] = field(default_factory=list)
    reviews: list[StoredReview] = field(default_factory=list)
    runs: list[dict] = field(default_factory=list)
    universities: list[dict] = field(default_factory=list)
    _next_id: int = 0
    _record_sources: dict[str, str] = field(default_factory=dict)

    def _new_id(self, prefix: str) -> str:
        self._next_id += 1
        return f"{prefix}{self._next_id}"

    def begin_run(self, source_code: str, started_at: datetime) -> str:
        run_id = self._new_id("run")
        self.runs.append({"id": run_id, "source": source_code, "started_at": started_at})
        return run_id

    def find_record(self, source_code: str, external_id: str) -> StoredRecord | None:
        return self.records.get((source_code, external_id))

    def insert_record(
        self,
        source_code: str,
        external_id: str,
        entity_type: str,
        payload: dict,
        content_hash: str,
        seen_at: datetime,
    ) -> StoredRecord:
        record = StoredRecord(
            id=self._new_id("record"),
            version=1,
            content_hash=content_hash,
            payload=payload,
        )
        self.records[(source_code, external_id)] = record
        self._record_sources[record.id] = source_code
        return record

    def update_record(
        self,
        record_id: str,
        payload: dict,
        content_hash: str,
        seen_at: datetime,
    ) -> int:
        for key, record in self.records.items():
            if record.id == record_id:
                updated = StoredRecord(
                    id=record.id,
                    version=record.version + 1,
                    content_hash=content_hash,
                    payload=payload,
                )
                self.records[key] = updated
                return updated.version
        raise KeyError(record_id)

    def touch_record(self, record_id: str, seen_at: datetime) -> None:
        return None

    def append_changes(
        self,
        record_id: str,
        source_code: str,
        changes: list[FieldChange],
        changed_at: datetime,
    ) -> None:
        self.changes.extend(changes)

    def queue_review(self, record_id: str, reason: str, priority: int, created_at: datetime) -> None:
        if any(item.record_id == record_id and item.reason == reason for item in self.reviews):
            return
        self.reviews.append(StoredReview(record_id=record_id, reason=reason))

    def finish_run(
        self,
        run_id: str,
        status: str,
        counts: RunCounts,
        finished_at: datetime,
        error_summary: str | None,
    ) -> None:
        for run in self.runs:
            if run["id"] == run_id:
                run.update(
                    {
                        "status": status,
                        "finished_at": finished_at,
                        "counts": counts.as_dict(),
                        "error": error_summary,
                    }
                )

    def find_possible_duplicates(
        self,
        domain: str | None,
        name: str,
        country_code: str | None,
        exclude_source_code: str,
        exclude_external_id: str,
    ) -> list[DuplicateMatch]:
        from .normalizers import domain_of

        matches: list[DuplicateMatch] = []
        for university in self.universities:
            if domain and domain_of(university.get("websiteUrl")) == domain:
                matches.append(DuplicateMatch("university", university["id"], university["name"], None))

        for (source_code, external_id), record in self.records.items():
            if source_code == exclude_source_code and external_id == exclude_external_id:
                continue
            payload = record.payload
            same_domain = domain and domain_of(payload.get("website")) == domain
            same_identity = (
                country_code
                and payload.get("countryCode") == country_code
                and str(payload.get("displayName", "")).strip().lower() == name.strip().lower()
            )
            if same_domain or same_identity:
                matches.append(
                    DuplicateMatch(
                        "candidate", record.id, str(payload.get("displayName", "")), source_code
                    )
                )
        return matches


class PostgresStore:
    """Writes runs, source records, changes and review items. It does not touch catalogue tables."""

    def __init__(self, dsn: str) -> None:
        import psycopg

        self._psycopg = psycopg
        self._dsn = clean_dsn(dsn)
        self._connection = None

    def _conn(self):
        """Reuses one connection for the store's lifetime instead of reconnecting per call -
        a bulk import can make tens of thousands of calls, and opening a fresh TCP/TLS
        connection for every one of them is both slow and a good way to exhaust Postgres's
        connection limit."""
        if self._connection is None or self._connection.closed:
            self._connection = self._psycopg.connect(self._dsn)
        return self._connection

    def close(self) -> None:
        if self._connection is not None and not self._connection.closed:
            self._connection.close()

    @contextmanager
    def _cursor(self):
        connection = self._conn()
        try:
            with connection.cursor() as cursor:
                yield cursor
            connection.commit()
        except Exception:
            connection.rollback()
            raise

    def begin_run(self, source_code: str, started_at: datetime) -> str:
        with self._cursor() as cursor:
            cursor.execute('SELECT id FROM "DataSource" WHERE code = %s', (source_code,))
            row = cursor.fetchone()
            if row is None:
                raise LookupError(f"no DataSource row with code {source_code!r}")
            cursor.execute(
                """
                INSERT INTO "IngestionRun" (id, "dataSourceId", status, "startedAt")
                VALUES (gen_random_uuid()::text, %s, 'RUNNING', %s)
                RETURNING id
                """,
                (row[0], started_at),
            )
            run_id = cursor.fetchone()[0]
            cursor.execute(
                'UPDATE "DataSource" SET "lastAttemptedRunAt" = %s WHERE id = %s',
                (started_at, row[0]),
            )
        return run_id

    def find_record(self, source_code: str, external_id: str) -> StoredRecord | None:
        with self._cursor() as cursor:
            cursor.execute(
                """
                SELECT r.id, r.version, r."contentHash", r.payload
                FROM "SourceRecord" r
                JOIN "DataSource" d ON d.id = r."dataSourceId"
                WHERE d.code = %s AND r."externalId" = %s
                """,
                (source_code, external_id),
            )
            row = cursor.fetchone()
        if row is None:
            return None
        return StoredRecord(id=row[0], version=row[1], content_hash=row[2], payload=row[3])

    def insert_record(
        self,
        source_code: str,
        external_id: str,
        entity_type: str,
        payload: dict,
        content_hash: str,
        seen_at: datetime,
    ) -> StoredRecord:
        with self._cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO "SourceRecord"
                    (id, "dataSourceId", "externalId", "entityType", payload, "contentHash", version, "firstSeenAt", "lastSeenAt")
                SELECT gen_random_uuid()::text, d.id, %s, %s, %s::jsonb, %s, 1, %s, %s
                FROM "DataSource" d WHERE d.code = %s
                RETURNING id, version, "contentHash"
                """,
                (
                    external_id,
                    entity_type,
                    json.dumps(payload),
                    content_hash,
                    seen_at,
                    seen_at,
                    source_code,
                ),
            )
            row = cursor.fetchone()
        if row is None:
            raise LookupError(f"no DataSource row with code {source_code!r}")
        return StoredRecord(id=row[0], version=row[1], content_hash=row[2], payload=payload)

    def update_record(
        self,
        record_id: str,
        payload: dict,
        content_hash: str,
        seen_at: datetime,
    ) -> int:
        with self._cursor() as cursor:
            cursor.execute(
                """
                UPDATE "SourceRecord"
                SET payload = %s::jsonb, "contentHash" = %s, version = version + 1, "lastSeenAt" = %s
                WHERE id = %s
                RETURNING version
                """,
                (json.dumps(payload), content_hash, seen_at, record_id),
            )
            row = cursor.fetchone()
        if row is None:
            raise KeyError(record_id)
        return row[0]

    def touch_record(self, record_id: str, seen_at: datetime) -> None:
        with self._cursor() as cursor:
            cursor.execute(
                'UPDATE "SourceRecord" SET "lastSeenAt" = %s WHERE id = %s',
                (seen_at, record_id),
            )

    def append_changes(
        self,
        record_id: str,
        source_code: str,
        changes: list[FieldChange],
        changed_at: datetime,
    ) -> None:
        if not changes:
            return
        with self._cursor() as cursor:
            for change in changes:
                cursor.execute(
                    """
                    INSERT INTO "ChangeLog"
                        (id, "entityType", "entityId", field, "oldValue", "newValue", "sourceRecordId", "dataSourceId", "changedAt")
                    SELECT gen_random_uuid()::text, 'UNIVERSITY_CANDIDATE', %s, %s, %s, %s, %s, d.id, %s
                    FROM "DataSource" d WHERE d.code = %s
                    """,
                    (
                        record_id,
                        change.field,
                        change.old_value,
                        change.new_value,
                        record_id,
                        changed_at,
                        source_code,
                    ),
                )

    def queue_review(self, record_id: str, reason: str, priority: int, created_at: datetime) -> None:
        with self._cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO "ReviewQueueItem" (id, "entityType", "entityId", reason, priority, status, "createdAt")
                SELECT gen_random_uuid()::text, 'UNIVERSITY_CANDIDATE', %s, %s, %s, 'OPEN', %s
                WHERE NOT EXISTS (
                    SELECT 1 FROM "ReviewQueueItem"
                    WHERE "entityType" = 'UNIVERSITY_CANDIDATE'
                      AND "entityId" = %s AND reason = %s AND status = 'OPEN'
                )
                """,
                (record_id, reason, priority, created_at, record_id, reason),
            )

    def finish_run(
        self,
        run_id: str,
        status: str,
        counts: RunCounts,
        finished_at: datetime,
        error_summary: str | None,
    ) -> None:
        with self._cursor() as cursor:
            cursor.execute(
                """
                UPDATE "IngestionRun"
                SET status = %s, "finishedAt" = %s, "recordsSeen" = %s, "recordsCreated" = %s,
                    "recordsUpdated" = %s, "recordsRejected" = %s, "errorSummary" = %s
                WHERE id = %s
                """,
                (
                    status,
                    finished_at,
                    counts.seen,
                    counts.created,
                    counts.updated,
                    counts.rejected,
                    error_summary,
                    run_id,
                ),
            )
            if status == "SUCCEEDED":
                cursor.execute(
                    """
                    UPDATE "DataSource" SET "lastSuccessfulRunAt" = %s
                    WHERE id = (SELECT "dataSourceId" FROM "IngestionRun" WHERE id = %s)
                    """,
                    (finished_at, run_id),
                )

    def find_possible_duplicates(
        self,
        domain: str | None,
        name: str,
        country_code: str | None,
        exclude_source_code: str,
        exclude_external_id: str,
    ) -> list[DuplicateMatch]:
        with self._cursor() as cursor:
            cursor.execute(
                """
                SELECT 'university' AS kind, id, name, NULL::text AS source_code
                FROM "University"
                WHERE %(domain)s::text IS NOT NULL
                  AND lower("websiteUrl") LIKE '%%' || lower(%(domain)s::text) || '%%'
                UNION ALL
                SELECT 'candidate' AS kind, r.id, r.payload->>'displayName' AS name, d.code AS source_code
                FROM "SourceRecord" r
                JOIN "DataSource" d ON d.id = r."dataSourceId"
                WHERE NOT (d.code = %(exclude_source)s::text AND r."externalId" = %(exclude_external_id)s::text)
                  AND (
                    (
                      %(domain)s::text IS NOT NULL
                      AND lower(r.payload->>'website') LIKE '%%' || lower(%(domain)s::text) || '%%'
                    )
                    OR (
                      %(country_code)s::text IS NOT NULL
                      AND r.payload->>'countryCode' = %(country_code)s::text
                      AND lower(r.payload->>'displayName') = lower(%(name)s::text)
                    )
                  )
                LIMIT 10
                """,
                {
                    "domain": domain,
                    "name": name,
                    "country_code": country_code,
                    "exclude_source": exclude_source_code,
                    "exclude_external_id": exclude_external_id,
                },
            )
            rows = cursor.fetchall()
        return [DuplicateMatch(kind=row[0], id=row[1], name=row[2] or "", source_code=row[3]) for row in rows]


def utcnow() -> datetime:
    return datetime.now(timezone.utc)
