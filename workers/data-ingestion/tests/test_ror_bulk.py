from __future__ import annotations

import json
import zipfile
from datetime import datetime, timezone

from openedu_ingest.ror_bulk import build_report, classify_record, promote_candidates
from openedu_ingest.ror_bulk import ReleaseMetadata
from openedu_ingest.store import InMemoryStore

UNIVERSITY_RECORD = {
    "id": "https://ror.org/052gg0110",
    "names": [{"lang": "en", "types": ["ror_display"], "value": "University of Oxford"}],
    "locations": [
        {"geonames_details": {"name": "Oxford", "country_code": "GB", "country_name": "United Kingdom"}}
    ],
    "links": [{"type": "website", "value": "https://www.ox.ac.uk"}],
    "types": ["education", "funder"],
    "status": "active",
}

HOSPITAL_RECORD = {
    "id": "https://ror.org/00hospital",
    "names": [{"lang": "en", "types": ["ror_display"], "value": "City General Hospital"}],
    "locations": [{"geonames_details": {"name": "Leeds", "country_code": "GB", "country_name": "United Kingdom"}}],
    "links": [],
    "types": ["healthcare"],
    "status": "active",
}

NAMED_COLLEGE_NOT_TYPED_EDUCATION = {
    "id": "https://ror.org/00college",
    "names": [{"lang": "en", "types": ["ror_display"], "value": "Riverside Community College"}],
    "locations": [{"geonames_details": {"name": "Riverside", "country_code": "US", "country_name": "United States"}}],
    "links": [],
    "types": ["facility"],
    "status": "active",
}

WITHDRAWN_RECORD = {
    "id": "https://ror.org/00withdrawn",
    "names": [{"lang": "en", "types": ["ror_display"], "value": "Old Merged University"}],
    "locations": [],
    "links": [],
    "types": ["education"],
    "status": "withdrawn",
}

UNPARSEABLE_RECORD = {"id": "https://ror.org/00broken", "names": []}


def test_classify_education_type_as_university_candidate():
    result = classify_record(UNIVERSITY_RECORD)
    assert result.classification == "UNIVERSITY_CANDIDATE"
    assert result.candidate is not None
    assert result.candidate.name == "University of Oxford"
    assert result.candidate.country_code == "GB"


def test_classify_healthcare_is_not_a_candidate():
    result = classify_record(HOSPITAL_RECORD)
    assert result.classification == "HEALTHCARE"
    assert result.candidate is None


def test_classify_name_hint_without_education_type_is_other_higher_ed():
    result = classify_record(NAMED_COLLEGE_NOT_TYPED_EDUCATION)
    assert result.classification == "OTHER_HIGHER_ED_CANDIDATE"
    assert result.candidate is not None


def test_classify_withdrawn_record_is_not_a_live_candidate():
    result = classify_record(WITHDRAWN_RECORD)
    assert result.classification == "INACTIVE_OR_WITHDRAWN"
    assert result.candidate is None


def test_classify_unparseable_record():
    result = classify_record(UNPARSEABLE_RECORD)
    assert result.classification == "UNPARSEABLE"
    assert result.candidate is None


def _write_fixture_zip(tmp_path, records) -> "Path":
    zip_path = tmp_path / "v0.0-test-ror-data.zip"
    with zipfile.ZipFile(zip_path, "w") as archive:
        archive.writestr("v0.0-test-ror-data.json", json.dumps(records))
    return zip_path


def _release(filename: str) -> ReleaseMetadata:
    return ReleaseMetadata(
        record_id=1,
        version_doi="10.5281/zenodo.1",
        concept_doi="10.5281/zenodo.0",
        publication_date="2026-01-01",
        filename=filename,
        download_url="https://example.org/x.zip",
        checksum_md5="",
        size_bytes=0,
    )


def test_build_report_counts_match_fixture(tmp_path):
    records = [UNIVERSITY_RECORD, HOSPITAL_RECORD, NAMED_COLLEGE_NOT_TYPED_EDUCATION, WITHDRAWN_RECORD, UNPARSEABLE_RECORD]
    zip_path = _write_fixture_zip(tmp_path, records)
    report, candidates = build_report(zip_path, _release(zip_path.name))

    assert report.total_records == 5
    assert report.university_candidates == 1
    assert report.unparseable == 1
    assert len(candidates) == 2  # university + other-higher-ed
    assert report.by_classification["HEALTHCARE"] == 1
    assert report.by_classification["INACTIVE_OR_WITHDRAWN"] == 1


def test_promote_candidates_is_idempotent(tmp_path):
    records = [UNIVERSITY_RECORD]
    zip_path = _write_fixture_zip(tmp_path, records)
    _, candidates = build_report(zip_path, _release(zip_path.name))

    store = InMemoryStore()
    now = datetime.now(timezone.utc)

    first = promote_candidates(candidates, store, "ROR_BULK", now)
    assert first.created == 1
    assert first.unchanged == 0

    second = promote_candidates(candidates, store, "ROR_BULK", now)
    assert second.created == 0
    assert second.unchanged == 1
    assert len(store.records) == 1
    assert len(store.reviews) == 1
