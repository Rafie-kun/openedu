from __future__ import annotations

from openedu_ingest.http import Fetcher, SourceError
from openedu_ingest.sources.ror import RorAdapter

# trimmed from a real ROR v2 response
ROR_ITEM = {
    "id": "https://ror.org/052gg0110",
    "names": [
        {"lang": "en", "types": ["ror_display", "label"], "value": "University of Oxford"},
        {"lang": "en", "types": ["alias"], "value": "Oxford University"},
        {"lang": "cy", "types": ["label"], "value": "Prifysgol Rhydychen"},
    ],
    "locations": [
        {
            "geonames_id": 2640729,
            "geonames_details": {
                "name": "Oxford",
                "country_code": "GB",
                "country_name": "United Kingdom",
            },
        }
    ],
    "links": [
        {"type": "website", "value": "https://www.ox.ac.uk"},
        {"type": "wikipedia", "value": "http://en.wikipedia.org/wiki/University_of_Oxford"},
    ],
    "types": ["education", "funder"],
    "status": "active",
    "admin": {"last_modified": {"date": "2026-10-20"}},
}


def test_parse_maps_the_fields_we_track():
    candidate = RorAdapter(["University of Oxford"]).parse(ROR_ITEM)

    assert candidate is not None
    assert candidate.external_id == "https://ror.org/052gg0110"
    assert candidate.name == "University of Oxford"
    assert candidate.aliases == ("Oxford University",)
    assert candidate.country_code == "GB"
    assert candidate.city == "Oxford"
    assert candidate.website_url == "https://www.ox.ac.uk"
    assert candidate.institution_type == "EDUCATION"


def test_parse_reports_the_source_url_in_the_payload():
    candidate = RorAdapter(["University of Oxford"]).parse(ROR_ITEM)
    assert candidate.payload["rorId"] == "https://ror.org/052gg0110"


def test_parse_returns_none_without_a_name():
    assert RorAdapter(["x"]).parse({"id": "https://ror.org/1", "names": []}) is None


def test_fetch_quotes_the_phrase_and_reads_items():
    seen: list[str] = []

    def transport(url, headers, timeout):
        seen.append(url)
        return 200, b'{"items": [{"id": "https://ror.org/1", "names": []}]}'

    fetcher = Fetcher(user_agent="test", min_interval_seconds=0, transport=transport)
    items = RorAdapter(["University of Oxford"]).fetch("University of Oxford", fetcher)

    assert len(items) == 1
    assert "query=%22University+of+Oxford%22" in seen[0]


def test_fetch_raises_a_source_error_on_a_missing_page():
    fetcher = Fetcher(
        user_agent="test",
        min_interval_seconds=0,
        transport=lambda url, headers, timeout: (404, b""),
    )
    try:
        RorAdapter(["x"]).fetch("x", fetcher)
    except SourceError as exc:
        assert "404" in str(exc)
    else:  # pragma: no cover
        raise AssertionError("expected SourceError")


def test_adapter_refuses_to_run_without_queries():
    try:
        RorAdapter([])
    except ValueError:
        return
    raise AssertionError("expected ValueError")
