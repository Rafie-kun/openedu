from __future__ import annotations

from openedu_ingest.http import Fetcher, SourceError
from openedu_ingest.sources.openalex import OpenAlexAdapter

# trimmed from a real OpenAlex institutions response
OPENALEX_ITEM = {
    "id": "https://openalex.org/I40120149",
    "ror": "https://ror.org/052gg0110",
    "display_name": "University of Oxford",
    "country_code": "GB",
    "type": "education",
    "homepage_url": "https://www.ox.ac.uk",
    "display_name_alternatives": ["Oxford University", "Prifysgol Rhydychen", "University of Oxford"],
    "geo": {"city": "Oxford", "country_code": "GB", "country": "United Kingdom"},
    "works_count": 621738,
    "updated_date": "2026-11-03T18:23:13",
}


def test_parse_maps_the_fields_we_track():
    candidate = OpenAlexAdapter(["University of Oxford"]).parse(OPENALEX_ITEM)

    assert candidate is not None
    assert candidate.external_id == "https://openalex.org/I40120149"
    assert candidate.name == "University of Oxford"
    assert candidate.aliases == ("Oxford University", "Prifysgol Rhydychen")
    assert candidate.country_code == "GB"
    assert candidate.city == "Oxford"
    assert candidate.website_url == "https://www.ox.ac.uk"
    assert candidate.institution_type == "EDUCATION"


def test_parse_reports_the_ror_cross_reference_in_the_payload():
    candidate = OpenAlexAdapter(["University of Oxford"]).parse(OPENALEX_ITEM)
    assert candidate.payload["rorId"] == "https://ror.org/052gg0110"


def test_parse_returns_none_without_a_display_name():
    assert OpenAlexAdapter(["x"]).parse({"id": "https://openalex.org/I1"}) is None


def test_fetch_encodes_the_query_and_reads_results():
    seen: list[str] = []

    def transport(url, headers, timeout):
        seen.append(url)
        return 200, b'{"results": [{"id": "https://openalex.org/I1", "display_name": "x"}]}'

    fetcher = Fetcher(user_agent="test", min_interval_seconds=0, transport=transport)
    items = OpenAlexAdapter(["University of Oxford"]).fetch("University of Oxford", fetcher)

    assert len(items) == 1
    assert "search=University+of+Oxford" in seen[0]


def test_fetch_appends_mailto_when_configured():
    seen: list[str] = []

    def transport(url, headers, timeout):
        seen.append(url)
        return 200, b'{"results": []}'

    fetcher = Fetcher(user_agent="test", min_interval_seconds=0, transport=transport)
    OpenAlexAdapter(["x"], mailto="ops@openedu.example").fetch("x", fetcher)

    assert "mailto=ops%40openedu.example" in seen[0]


def test_fetch_raises_a_source_error_on_a_missing_page():
    fetcher = Fetcher(
        user_agent="test",
        min_interval_seconds=0,
        transport=lambda url, headers, timeout: (503, b""),
    )
    try:
        OpenAlexAdapter(["x"]).fetch("x", fetcher)
    except SourceError as exc:
        assert "503" in str(exc)
    else:  # pragma: no cover
        raise AssertionError("expected SourceError")


def test_adapter_refuses_to_run_without_queries():
    try:
        OpenAlexAdapter([])
    except ValueError:
        return
    raise AssertionError("expected ValueError")
