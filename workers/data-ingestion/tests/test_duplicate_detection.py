from __future__ import annotations

from datetime import datetime, timezone

from openedu_ingest.models import InstitutionCandidate
from openedu_ingest.store import InMemoryStore

NOW = datetime.now(timezone.utc)


def _candidate(external_id: str, name: str, website: str | None, country_code: str | None) -> InstitutionCandidate:
    return InstitutionCandidate(
        external_id=external_id,
        name=name,
        country_code=country_code,
        city=None,
        website_url=website,
        institution_type=None,
        aliases=(),
        payload={
            "displayName": name,
            "website": website,
            "countryCode": country_code,
            "city": None,
            "types": [],
            "status": "active",
        },
    )


def test_matches_an_existing_university_by_domain():
    store = InMemoryStore(universities=[{"id": "u1", "name": "Example University", "websiteUrl": "https://www.example.edu/"}])
    matches = store.find_possible_duplicates("example.edu", "Something Else", "US", "ROR", "x1")
    assert len(matches) == 1
    assert matches[0].kind == "university"
    assert matches[0].id == "u1"


def test_matches_a_candidate_from_a_different_source_by_domain():
    store = InMemoryStore()
    store.insert_record(
        source_code="SOMNIA_LEGACY",
        external_id="somnia:abc",
        entity_type="UNIVERSITY_CANDIDATE",
        payload={"displayName": "Example University", "website": "https://example.edu/", "countryCode": "US"},
        content_hash="h1",
        seen_at=NOW,
    )
    matches = store.find_possible_duplicates("example.edu", "Example University (Alt Name)", "US", "ROR_BULK", "ror:xyz")
    assert len(matches) == 1
    assert matches[0].kind == "candidate"
    assert matches[0].source_code == "SOMNIA_LEGACY"


def test_matches_by_exact_name_and_country_when_no_website():
    store = InMemoryStore()
    store.insert_record(
        source_code="SOMNIA_LEGACY",
        external_id="somnia:abc",
        entity_type="UNIVERSITY_CANDIDATE",
        payload={"displayName": "Example University", "website": None, "countryCode": "US"},
        content_hash="h1",
        seen_at=NOW,
    )
    matches = store.find_possible_duplicates(None, "Example University", "US", "ROR_BULK", "ror:xyz")
    assert len(matches) == 1


def test_does_not_match_itself():
    store = InMemoryStore()
    store.insert_record(
        source_code="ROR_BULK",
        external_id="ror:xyz",
        entity_type="UNIVERSITY_CANDIDATE",
        payload={"displayName": "Example University", "website": "https://example.edu/", "countryCode": "US"},
        content_hash="h1",
        seen_at=NOW,
    )
    matches = store.find_possible_duplicates("example.edu", "Example University", "US", "ROR_BULK", "ror:xyz")
    assert matches == []


def test_no_false_positive_for_unrelated_institutions():
    store = InMemoryStore(universities=[{"id": "u1", "name": "Unrelated College", "websiteUrl": "https://unrelated.edu/"}])
    matches = store.find_possible_duplicates("example.edu", "Example University", "US", "ROR_BULK", "ror:xyz")
    assert matches == []


def test_run_source_flags_a_duplicate_with_higher_priority(monkeypatch):
    from openedu_ingest.http import Fetcher
    from openedu_ingest.jobs.run_source import run_source

    class StubAdapter:
        code = "ROR"
        entity_type = "UNIVERSITY_CANDIDATE"

        def queries(self):
            return ["Example University"]

        def fetch(self, query, fetcher):
            return [{"raw": True}]

        def parse(self, item):
            return _candidate("https://ror.org/dup1", "Example University", "https://example.edu/", "US")

    store = InMemoryStore()
    store.insert_record(
        source_code="SOMNIA_LEGACY",
        external_id="somnia:abc",
        entity_type="UNIVERSITY_CANDIDATE",
        payload={"displayName": "Example University", "website": "https://example.edu/", "countryCode": "US"},
        content_hash="h1",
        seen_at=NOW,
    )

    fetcher = Fetcher(user_agent="test", min_interval_seconds=0)
    summary = run_source(StubAdapter(), store, fetcher, now=NOW)

    assert summary.counts.created == 1
    assert len(store.reviews) == 1
    new_review = store.reviews[-1]
    assert "possible duplicate" in new_review.reason
    assert "SOMNIA_LEGACY" in new_review.reason
