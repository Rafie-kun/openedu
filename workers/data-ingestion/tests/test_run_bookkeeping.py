"""A run must never be left at RUNNING, and a bulk promotion must record a run of its own."""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

from openedu_ingest.http import Fetcher
from openedu_ingest.jobs.run_source import run_source
from openedu_ingest.models import InstitutionCandidate
from openedu_ingest.ror_bulk import promote_candidates
from openedu_ingest.store import InMemoryStore

NOW = datetime.now(timezone.utc)


def _candidate(external_id: str, name: str) -> InstitutionCandidate:
    return InstitutionCandidate(
        external_id=external_id,
        name=name,
        country_code="US",
        city=None,
        website_url=None,
        institution_type=None,
        aliases=(),
        payload={
            "displayName": name,
            "website": None,
            "countryCode": "US",
            "city": None,
            "types": [],
            "status": "active",
            "classification": "UNIVERSITY_CANDIDATE",
        },
    )


class _ExplodingAdapter:
    code = "ROR"
    entity_type = "UNIVERSITY_CANDIDATE"

    def queries(self):
        return ["anything"]

    def fetch(self, query, fetcher):
        raise RuntimeError("transport blew up in a way SourceError does not cover")

    def parse(self, item):  # pragma: no cover - never reached
        return None


def test_run_source_records_failed_instead_of_leaving_it_running():
    store = InMemoryStore()
    fetcher = Fetcher(user_agent="test", min_interval_seconds=0)

    with pytest.raises(RuntimeError):
        run_source(_ExplodingAdapter(), store, fetcher, now=NOW)

    assert len(store.runs) == 1
    assert store.runs[0]["status"] == "FAILED"
    assert "blew up" in store.runs[0]["error"]


def test_promote_candidates_records_a_succeeded_run():
    store = InMemoryStore()
    counts = promote_candidates(
        [_candidate("https://ror.org/aaa", "Example University")],
        store,
        "ROR_BULK",
        NOW,
    )

    assert counts.created == 1
    assert len(store.runs) == 1
    assert store.runs[0]["status"] == "SUCCEEDED"
    assert store.runs[0]["counts"]["created"] == 1


def test_promote_candidates_run_is_idempotent_on_reimport():
    store = InMemoryStore()
    candidates = [_candidate("https://ror.org/aaa", "Example University")]

    promote_candidates(candidates, store, "ROR_BULK", NOW)
    second = promote_candidates(candidates, store, "ROR_BULK", NOW)

    assert second.created == 0
    assert second.unchanged == 1
    assert len(store.runs) == 2
    assert all(run["status"] == "SUCCEEDED" for run in store.runs)
