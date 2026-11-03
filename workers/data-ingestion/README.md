# Data ingestion worker

Python worker that reads an external source, normalises what it finds, and records differences
against what the platform saw last time. It writes only to the data-engineering tables:
`IngestionRun`, `SourceRecord`, `ChangeLog` and `ReviewQueueItem`.

It does not write to `University`, `Programme`, `Scholarship` or any other catalogue table. A human
approves a candidate in the admin area before anything becomes public.

## What exists today

- one real adapter: ROR (`sources/ror.py`), which looks institutions up by exact name
- the pipeline: fetch, parse, normalise, validate, hash, diff, queue for review
- a Postgres store and an in-memory store, so the pipeline can be tested without a database
- change detection that runs the same query twice without creating duplicates

Not built yet: the Redis queue, the scheduler, retries across jobs, and adapters for any other
source. Those need their own source research first.

## Running it

```bash
cd workers/data-ingestion
python -m pip install -e ".[dev]"

# nothing is written, the summary is printed
PYTHONPATH=src python -m openedu_ingest.cli run --source ROR --query "University of Oxford" --dry-run

# writes a run, a source record and a review item
PYTHONPATH=src python -m openedu_ingest.cli run --source ROR --query "University of Oxford"
```

`DATABASE_URL` has to point at the same database the web app uses. Prisma-style `?schema=public` in
the URL is stripped before connecting, because libpq rejects unknown options.

On Windows, use `$env:PYTHONPATH="src"` and `$env:DATABASE_URL="..."` before the command.

## Tests

```bash
cd workers/data-ingestion
python -m pytest
```

Tests use recorded payloads and a fake transport, so they run without a network connection. The
`PostgresStore` is exercised by hand against a local database, not in the unit test suite.

## Configuration

| Variable                      | Default                   | Meaning                                                |
| ----------------------------- | ------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`                | none                      | required unless `--dry-run`                            |
| `INGEST_USER_AGENT`           | `OpenEdu/0.1 (+repo URL)` | sent with every request; sources use it to identify us |
| `INGEST_TIMEOUT_SECONDS`      | `30`                      | per request                                            |
| `INGEST_MIN_INTERVAL_SECONDS` | `1`                       | pause between requests, so the source is not hammered  |
| `INGEST_MAX_ATTEMPTS`         | `3`                       | 4xx responses other than rate limits are not retried   |

## Adding a source

1. Confirm the source allows this use: API or dataset, licence, attribution, rate limits, and whether
   bulk collection is permitted. Record it in `docs/data-sources.md` and in the `DataSource` row.
2. Add an adapter under `src/openedu_ingest/sources/` with `code` matching `DataSource.code`,
   `queries()`, `fetch()` and `parse()`.
3. Keep `queries()` short and specific. Do not crawl a whole site to find out what it contains.
4. Add a fixture and a parse test. Do not write a test that calls the live source.
