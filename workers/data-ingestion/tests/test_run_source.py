from __future__ import annotations

from datetime import datetime, timezone

from openedu_ingest.http import Fetcher
from openedu_ingest.jobs.run_source import run_source
from openedu_ingest.sources.ror import RorAdapter
from openedu_ingest.store import InMemoryStore

AT = datetime(2026, 11, 3, 9, 0, tzinfo=timezone.utc)

ITEM = {
    "id": "https://ror.org/052gg0110",
    "names": [{"lang": "en", "types": ["ror_display", "label"], "value": "University of Oxford"}],
    "locations": [{"geonames_details": {"name": "Oxford", "country_code": "GB"}}],
    "links": [{"type": "website", "value": "https://www.ox.ac.uk"}],
    "types": ["education"],
    "status": "active",
}


def fetcher_for(items: list[dict], status: int = 200) -> Fetcher:
    body = __import__("json").dumps({"items": items}).encode()
    return Fetcher(
        user_agent="test",
        min_interval_seconds=0,
        max_attempts=1,
        transport=lambda url, headers, timeout: (status, body),
    )


def test_first_run_stores_a_candidate_and_asks_for_review():
    store = InMemoryStore()
    summary = run_source(RorAdapter(["University of Oxford"]), store, fetcher_for([ITEM]), now=AT)

    assert summary.status == "SUCCEEDED"
    assert summary.counts.created == 1
    assert store.records[("ROR", "https://ror.org/052gg0110")].version == 1
    assert [review.reason for review in store.reviews][0].startswith("new candidate")


def test_second_run_with_the_same_payload_changes_nothing():
    store = InMemoryStore()
    run_source(RorAdapter(["University of Oxford"]), store, fetcher_for([ITEM]), now=AT)
    second = run_source(RorAdapter(["University of Oxford"]), store, fetcher_for([ITEM]), now=AT)

    assert second.counts.unchanged == 1
    assert second.counts.created == 0
    assert len(store.changes) == 0
    assert len(store.reviews) == 1


def test_changed_values_bump_the_version_and_land_in_the_change_log():
    store = InMemoryStore()
    run_source(RorAdapter(["University of Oxford"]), store, fetcher_for([ITEM]), now=AT)

    renamed = dict(ITEM)
    renamed["names"] = [{"lang": "en", "types": ["ror_display", "label"], "value": "Oxford University"}]
    summary = run_source(RorAdapter(["University of Oxford"]), store, fetcher_for([renamed]), now=AT)

    record = store.records[("ROR", "https://ror.org/052gg0110")]
    assert summary.counts.updated == 1
    assert record.version == 2
    assert [change.field for change in store.changes] == ["displayName"]
    assert any("source values changed" in review.reason for review in store.reviews)


def test_a_failed_fetch_is_recorded_and_the_run_is_marked_failed():
    store = InMemoryStore()
    adapter = RorAdapter(["University of Oxford"])
    summary = run_source(adapter, store, fetcher_for([], status=500), now=AT)

    assert summary.status == "FAILED"
    assert summary.counts.seen == 0
    assert "HTTP 500" in summary.errors[0]
    assert store.runs[0]["status"] == "FAILED"


def test_a_record_without_a_name_is_rejected_not_stored():
    store = InMemoryStore()
    nameless = {"id": "https://ror.org/1", "names": []}
    summary = run_source(RorAdapter(["x"]), store, fetcher_for([nameless]), now=AT)

    assert summary.counts.rejected == 1
    assert summary.status == "PARTIAL"
    assert store.records == {}
