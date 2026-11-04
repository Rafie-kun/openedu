from __future__ import annotations

import argparse
import json
import sys

from .config import load_settings
from .http import Fetcher
from .jobs.run_source import run_source
from .sources.openalex import OpenAlexAdapter
from .sources.ror import RorAdapter
from .store import InMemoryStore, PostgresStore


def build_adapter(source: str, queries: list[str], settings):
    code = source.upper()
    if code == "ROR":
        return RorAdapter(queries)
    if code == "OPENALEX":
        return OpenAlexAdapter(queries, mailto=settings.contact_email)
    raise SystemExit(f"unknown source {source!r}, known sources: ROR, OPENALEX")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="openedu-ingest")
    subparsers = parser.add_subparsers(dest="command", required=True)

    run_parser = subparsers.add_parser("run", help="read one source and record what changed")
    run_parser.add_argument("--source", required=True, help="DataSource code, for example ROR")
    run_parser.add_argument(
        "--query",
        action="append",
        required=True,
        help="what to ask the source for, repeat for several",
    )
    run_parser.add_argument(
        "--dry-run",
        action="store_true",
        help="keep everything in memory instead of writing to the database",
    )

    args = parser.parse_args(argv)
    settings = load_settings()

    if args.command == "run":
        adapter = build_adapter(args.source, args.query, settings)
        if args.dry_run:
            store = InMemoryStore()
        elif settings.database_url:
            store = PostgresStore(settings.database_url)
        else:
            print("DATABASE_URL is not set; use --dry-run or provide it", file=sys.stderr)
            return 2

        fetcher = Fetcher(
            user_agent=settings.user_agent,
            timeout_seconds=settings.timeout_seconds,
            min_interval_seconds=settings.min_interval_seconds,
            max_attempts=settings.max_attempts,
        )
        summary = run_source(adapter, store, fetcher)
        print(
            json.dumps(
                {
                    "source": summary.source_code,
                    "run": summary.run_id,
                    "status": summary.status,
                    "counts": summary.counts.as_dict(),
                    "errors": summary.errors,
                },
                indent=2,
            )
        )
        return 0 if summary.status != "FAILED" else 1

    return 2


if __name__ == "__main__":
    raise SystemExit(main())
