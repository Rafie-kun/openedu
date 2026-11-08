from __future__ import annotations

import json

from openedu_ingest.http import Fetcher
from openedu_ingest.sources.somnia import SomniaLegacyAdapter

# shaped like the real legacy file: 3 "University of Oxford" rows with disagreeing numeric fields,
# one single "Harvard University" row, and one record missing a usable name.
LEGACY_RECORDS = [
    {
        "id": "uni-003",
        "name": "University of Oxford",
        "country": "United Kingdom",
        "city": "Oxford",
        "website": "https://www.ox.ac.uk/",
        "ranking": 3,
        "acceptanceRate": "51.6%",
        "averageGpa": 3.13,
        "tuitionMin": 13688,
        "tuitionMax": 32368,
    },
    {
        "id": "uni-021",
        "name": "University of Oxford",
        "country": "United Kingdom",
        "city": "Oxford",
        "website": "https://www.ox.ac.uk/",
        "ranking": 21,
        "acceptanceRate": "12.0%",
        "averageGpa": 3.28,
        "tuitionMin": 16426,
        "tuitionMax": 33417,
    },
    {
        "id": "uni-023",
        "name": "University  of Oxford",
        "country": "United Kingdom",
        "city": "Oxford",
        "website": "https://www.ox.ac.uk/",
        "ranking": 23,
        "acceptanceRate": "8.2%",
        "averageGpa": 3.85,
        "tuitionMin": 16734,
        "tuitionMax": 36566,
    },
    {
        "id": "uni-harvard",
        "name": "Harvard University",
        "country": "United States",
        "city": "Cambridge",
        "website": "https://www.harvard.edu/",
        "ranking": 1,
        "acceptanceRate": "3.4%",
        "averageGpa": 3.95,
        "tuitionMin": 54000,
        "tuitionMax": 61200,
    },
    {"id": "uni-bad", "name": "", "country": "Nowhere"},
]


def _fetcher_returning(records: list[dict]) -> Fetcher:
    body = json.dumps(records).encode("utf-8")
    return Fetcher(
        user_agent="test",
        min_interval_seconds=0,
        transport=lambda url, headers, timeout: (200, body),
    )


def test_fetch_collapses_duplicate_rows_into_one_group_per_identity():
    adapter = SomniaLegacyAdapter()
    groups = adapter.fetch("universities", _fetcher_returning(LEGACY_RECORDS))

    assert len(groups) == 2
    oxford = next(g for g in groups if g["name"] == "University of Oxford")
    assert sorted(oxford["legacyIds"]) == ["uni-003", "uni-021", "uni-023"]


def test_fetch_skips_records_with_no_usable_name():
    adapter = SomniaLegacyAdapter()
    groups = adapter.fetch("universities", _fetcher_returning(LEGACY_RECORDS))
    assert all(g["name"] != "" for g in groups)
    assert len(groups) == 2


def test_parse_only_extracts_identity_fields_never_the_synthetic_ones():
    adapter = SomniaLegacyAdapter()
    [group] = [
        g
        for g in adapter.fetch("universities", _fetcher_returning(LEGACY_RECORDS))
        if g["name"] == "Harvard University"
    ]
    candidate = adapter.parse(group)

    assert candidate is not None
    assert candidate.name == "Harvard University"
    assert candidate.country_code == "US"
    assert candidate.city == "Cambridge"
    assert candidate.website_url == "https://www.harvard.edu"
    for forbidden in ("ranking", "acceptanceRate", "averageGpa", "tuitionMin", "tuitionMax"):
        assert forbidden not in candidate.payload


def test_parse_is_stable_for_the_same_identity():
    adapter = SomniaLegacyAdapter()
    groups = adapter.fetch("universities", _fetcher_returning(LEGACY_RECORDS))
    oxford = next(g for g in groups if g["name"] == "University of Oxford")

    first = adapter.parse(oxford)
    second = adapter.parse(dict(oxford))
    assert first.external_id == second.external_id


def test_parse_keeps_an_unmapped_country_as_free_text_without_guessing():
    adapter = SomniaLegacyAdapter()
    group = {
        "identityKey": "test uni|atlantis",
        "name": "Test University",
        "country": "Atlantis",
        "cities": [],
        "websites": ["https://test.example/"],
        "legacyIds": ["uni-x"],
    }
    candidate = adapter.parse(group)
    assert candidate.country_code is None
    assert candidate.payload["countryName"] == "Atlantis"


def test_fetch_records_disagreeing_cities_and_websites_as_conflicts_not_facts():
    records = [
        {"id": "a", "name": "Conflict U", "country": "Testland", "city": "Northtown", "website": "https://a.example/"},
        {"id": "b", "name": "Conflict U", "country": "Testland", "city": "Southtown", "website": "https://b.example/"},
    ]
    adapter = SomniaLegacyAdapter()
    [group] = adapter.fetch("universities", _fetcher_returning(records))
    candidate = adapter.parse(group)

    assert candidate.city == "Northtown"
    assert candidate.payload["legacyConflictingCities"] == ["Southtown"]
    assert candidate.payload["legacyConflictingWebsites"] == ["https://b.example/"]
