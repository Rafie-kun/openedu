from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from . import ror_bulk
from .config import load_settings
from .http import Fetcher
from .jobs.run_source import run_source
from .sources.openalex import OpenAlexAdapter
from .sources.ror import RorAdapter
from .sources.somnia import SomniaLegacyAdapter
from .store import InMemoryStore, PostgresStore, utcnow


def build_adapter(source: str, queries: list[str], settings):
    code = source.upper()
    if code == "ROR":
        return RorAdapter(queries)
    if code == "OPENALEX":
        return OpenAlexAdapter(queries, mailto=settings.contact_email)
    if code == "SOMNIA_LEGACY":
        return SomniaLegacyAdapter(queries)
    raise SystemExit(f"unknown source {source!r}, known sources: ROR, OPENALEX, SOMNIA_LEGACY")


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

    bulk_parser = subparsers.add_parser(
        "ror-bulk",
        help="download the current ROR data dump, classify every record, and write offline artifacts",
    )
    bulk_parser.add_argument(
        "--dest",
        default="artifacts/ror",
        help="directory for the downloaded zip, manifest and report (default: artifacts/ror)",
    )
    bulk_parser.add_argument(
        "--promote",
        action="store_true",
        help="after building the report, write SOURCE_CODE candidates to ReviewQueueItem (needs DATABASE_URL)",
    )
    bulk_parser.add_argument(
        "--skip-download",
        action="store_true",
        help="reuse an already-downloaded zip in --dest instead of fetching it again",
    )

    args = parser.parse_args(argv)
    settings = load_settings()

    if args.command == "ror-bulk":
        return _run_ror_bulk(args, settings)

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


def _run_ror_bulk(args: argparse.Namespace, settings) -> int:
    dest_dir = Path(args.dest)
    fetcher = Fetcher(
        user_agent=settings.user_agent,
        timeout_seconds=settings.timeout_seconds,
        min_interval_seconds=settings.min_interval_seconds,
        max_attempts=settings.max_attempts,
    )

    release = ror_bulk.fetch_latest_release(fetcher)
    zip_path = dest_dir / release.filename
    if args.skip_download and zip_path.exists():
        print(f"reusing {zip_path}", file=sys.stderr)
    else:
        zip_path = ror_bulk.download_release(release, fetcher, dest_dir)

    report, candidates = ror_bulk.build_report(zip_path, release)

    (dest_dir / "manifest.json").write_text(
        json.dumps(report.as_dict()["release"], indent=2), encoding="utf-8"
    )
    (dest_dir / "import-report.json").write_text(
        json.dumps(report.as_dict(), indent=2), encoding="utf-8"
    )
    with (dest_dir / "institution-candidates.jsonl").open("w", encoding="utf-8") as handle:
        for candidate in candidates:
            handle.write(json.dumps(candidate.payload, ensure_ascii=False) + "\n")

    print(json.dumps(report.as_dict(), indent=2))

    if args.promote:
        if not settings.database_url:
            print("DATABASE_URL is not set; cannot --promote", file=sys.stderr)
            return 2
        store = PostgresStore(settings.database_url)
        try:
            counts = ror_bulk.promote_candidates(
                candidates,
                store,
                "ROR_BULK",
                utcnow(),
                on_progress=lambda n: print(f"\rpromoted {n}/{len(candidates)}", end="", file=sys.stderr),
            )
        finally:
            store.close()
        print(file=sys.stderr)
        print(json.dumps({"promoted": counts.as_dict()}, indent=2))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
