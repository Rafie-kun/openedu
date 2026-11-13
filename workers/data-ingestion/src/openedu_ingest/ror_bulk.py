from __future__ import annotations

import hashlib
import json
import sys
import urllib.request
import zipfile
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from .change_detection import content_hash
from .http import Fetcher
from .models import InstitutionCandidate, RunCounts
from .normalizers import domain_of, normalise_country_code, normalise_name, normalise_website
from .store import Store, utcnow

CONCEPT_RECORD_URL = "https://zenodo.org/api/records/6347574"

# Conservative, not an accreditation claim. "education" organisations in ROR include everything from
# a national ministry's training arm to a single academic department; a candidate from this type still
# needs identity verification before it is treated as a degree-awarding institution.
UNIVERSITY_CANDIDATE_TYPES = {"education"}
OTHER_HIGHER_ED_HINT_WORDS = ("university", "college", "institute of technology", "polytechnic")


@dataclass(frozen=True)
class ReleaseMetadata:
    record_id: int
    version_doi: str
    concept_doi: str
    publication_date: str
    filename: str
    download_url: str
    checksum_md5: str
    size_bytes: int


@dataclass(frozen=True)
class ClassifiedRecord:
    candidate: InstitutionCandidate | None
    classification: str
    reason: str


@dataclass
class BulkReport:
    release: ReleaseMetadata
    total_records: int = 0
    by_status: dict[str, int] = field(default_factory=dict)
    by_classification: dict[str, int] = field(default_factory=dict)
    by_country: dict[str, int] = field(default_factory=dict)
    university_candidates: int = 0
    unparseable: int = 0

    def as_dict(self) -> dict:
        return {
            "release": {
                "recordId": self.release.record_id,
                "versionDoi": self.release.version_doi,
                "conceptDoi": self.release.concept_doi,
                "publicationDate": self.release.publication_date,
                "filename": self.release.filename,
                "checksumMd5": self.release.checksum_md5,
                "sizeBytes": self.release.size_bytes,
            },
            "totalRecords": self.total_records,
            "byStatus": self.by_status,
            "byClassification": self.by_classification,
            "byCountryTop20": dict(
                sorted(self.by_country.items(), key=lambda item: item[1], reverse=True)[:20]
            ),
            "universityCandidates": self.university_candidates,
            "unparseable": self.unparseable,
        }


def fetch_latest_release(fetcher: Fetcher) -> ReleaseMetadata:
    """Reads the Zenodo concept record, which always resolves to the newest ROR release."""
    body = fetcher.get_json(CONCEPT_RECORD_URL)
    files = body.get("files") or []
    if not files:
        raise ValueError("Zenodo record for ROR has no files")
    file_info = files[0]
    checksum = str(file_info.get("checksum", "")).removeprefix("md5:")
    metadata = body.get("metadata") or {}
    return ReleaseMetadata(
        record_id=int(body["id"]),
        version_doi=str(body.get("doi", "")),
        concept_doi=str(body.get("conceptdoi", "")),
        publication_date=str(metadata.get("publication_date", "")),
        filename=str(file_info["key"]),
        download_url=str(file_info["links"]["self"]),
        checksum_md5=checksum,
        size_bytes=int(file_info.get("size", 0)),
    )


def download_release(
    release: ReleaseMetadata,
    fetcher: Fetcher,
    dest_dir: Path,
    chunk_size: int = 262_144,
    max_attempts: int = 5,
) -> Path:
    """Streams the release zip to disk in chunks and verifies its checksum.

    A single `response.read()` of the whole ~40 MB body proved unreliable on this network (it dropped
    mid-transfer). Reading and writing in small chunks, with a retry loop per attempt that resumes the
    checksum from scratch, survives that kind of partial failure instead of needing the whole file in
    one uninterrupted read.
    """
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / release.filename
    last_error: Exception | None = None

    for attempt in range(1, max_attempts + 1):
        digest = hashlib.md5()
        request = urllib.request.Request(
            release.download_url, headers={"User-Agent": fetcher.user_agent}
        )
        try:
            with urllib.request.urlopen(request, timeout=fetcher.timeout_seconds) as response, dest_path.open(
                "wb"
            ) as handle:
                written = 0
                while True:
                    chunk = response.read(chunk_size)
                    if not chunk:
                        break
                    handle.write(chunk)
                    digest.update(chunk)
                    written += len(chunk)
                    print(f"\r{release.filename}: {written:,} bytes", end="", file=sys.stderr)
            print(file=sys.stderr)
        except OSError as exc:
            last_error = exc
            print(f"attempt {attempt} failed: {exc}", file=sys.stderr)
            continue

        actual = digest.hexdigest()
        if release.checksum_md5 and actual != release.checksum_md5:
            last_error = ValueError(
                f"checksum mismatch for {release.filename}: expected {release.checksum_md5}, got {actual}"
            )
            print(f"attempt {attempt}: {last_error}", file=sys.stderr)
            continue

        return dest_path

    raise last_error or RuntimeError(f"failed to download {release.filename}")


def iter_raw_records(zip_path: Path):
    """Yields each raw ROR record dict from the release zip's JSON file.

    Loads the whole JSON array at once rather than streaming token-by-token: at the current release
    size (tens of MB, ~150k records) this comfortably fits in memory, and avoids adding a streaming-JSON
    dependency for a problem this dataset doesn't actually have yet. Revisit if a future release grows
    by an order of magnitude.
    """
    with zipfile.ZipFile(zip_path) as archive:
        json_name = next((name for name in archive.namelist() if name.endswith(".json")), None)
        if json_name is None:
            raise ValueError(f"no .json file found inside {zip_path}")
        with archive.open(json_name) as handle:
            records = json.load(handle)
    if not isinstance(records, list):
        raise ValueError(f"expected a JSON array in {zip_path}, got {type(records)}")
    yield from records


def _display_name(record: dict) -> str | None:
    for name in record.get("names") or []:
        if isinstance(name, dict) and "ror_display" in (name.get("types") or []):
            value = name.get("value")
            if isinstance(value, str) and value.strip():
                return normalise_name(value)
    return None


def _first_location(record: dict) -> dict:
    locations = record.get("locations") or []
    if not locations:
        return {}
    details = locations[0].get("geonames_details") or {}
    return details if isinstance(details, dict) else {}


def _website(record: dict) -> str | None:
    for link in record.get("links") or []:
        if isinstance(link, dict) and link.get("type") == "website":
            value = link.get("value")
            if isinstance(value, str):
                return value
    return None


def classify_record(record: dict) -> ClassifiedRecord:
    """Sorts one raw ROR record into a candidate class. Never asserts accreditation."""
    external_id = record.get("id")
    display = _display_name(record)
    if not isinstance(external_id, str) or not display:
        return ClassifiedRecord(None, "UNPARSEABLE", "missing id or display name")

    status = record.get("status")
    types = record.get("types") or []
    location = _first_location(record)
    website = _website(record)
    lower_name = display.lower()

    if status in ("inactive", "withdrawn"):
        classification = "INACTIVE_OR_WITHDRAWN"
    elif any(t in UNIVERSITY_CANDIDATE_TYPES for t in types):
        classification = "UNIVERSITY_CANDIDATE"
    elif any(word in lower_name for word in OTHER_HIGHER_ED_HINT_WORDS):
        classification = "OTHER_HIGHER_ED_CANDIDATE"
    elif "healthcare" in types:
        classification = "HEALTHCARE"
    elif "government" in types:
        classification = "GOVERNMENT"
    elif "company" in types:
        classification = "COMPANY"
    elif "funder" in types or "nonprofit" in types:
        classification = "NONPROFIT_OR_FUNDER"
    else:
        classification = "OTHER"

    candidate = None
    if classification in ("UNIVERSITY_CANDIDATE", "OTHER_HIGHER_ED_CANDIDATE"):
        aliases = tuple(
            name
            for name in (
                normalise_name(entry.get("value", ""))
                for entry in (record.get("names") or [])
                if isinstance(entry, dict) and "alias" in (entry.get("types") or [])
            )
            if name and name != display
        )
        payload = {
            "rorId": external_id,
            "displayName": display,
            "aliases": list(aliases),
            "city": location.get("name"),
            "countryCode": location.get("country_code"),
            "countryName": location.get("country_name"),
            "website": website,
            "types": types,
            "status": status,
            "classification": classification,
            "lastModified": (record.get("admin") or {}).get("last_modified", {}).get("date"),
        }
        candidate = InstitutionCandidate(
            external_id=external_id,
            name=display,
            country_code=normalise_country_code(location.get("country_code")),
            city=normalise_name(location.get("name", "")) or None,
            website_url=normalise_website(website),
            institution_type=classification,
            aliases=aliases,
            payload=payload,
        )

    return ClassifiedRecord(candidate, classification, classification)


def build_report(zip_path: Path, release: ReleaseMetadata) -> tuple[BulkReport, list[InstitutionCandidate]]:
    report = BulkReport(release=release)
    candidates: list[InstitutionCandidate] = []

    for raw in iter_raw_records(zip_path):
        report.total_records += 1
        status = str(raw.get("status") or "unknown")
        report.by_status[status] = report.by_status.get(status, 0) + 1

        result = classify_record(raw)
        report.by_classification[result.classification] = (
            report.by_classification.get(result.classification, 0) + 1
        )
        if result.classification == "UNPARSEABLE":
            report.unparseable += 1
            continue

        location = _first_location(raw)
        country = location.get("country_name")
        if country:
            report.by_country[country] = report.by_country.get(country, 0) + 1

        if result.candidate is not None:
            candidates.append(result.candidate)
            if result.classification == "UNIVERSITY_CANDIDATE":
                report.university_candidates += 1

    return report, candidates


def promote_candidates(
    candidates: list[InstitutionCandidate],
    store: Store,
    source_code: str,
    now: datetime,
    on_progress=None,
) -> RunCounts:
    """Writes SourceRecord/ReviewQueueItem rows for already-classified candidates.

    Shares the same create/unchanged/update semantics as jobs.run_source, adapted for a precomputed
    candidate list instead of a live per-query fetch. Never writes to a catalogue table directly.

    The whole import is bracketed by an IngestionRun so a bulk promotion leaves the same run-level
    provenance as a live source run, and a crash is recorded as FAILED rather than left RUNNING.
    """
    counts = RunCounts()
    run_id = store.begin_run(source_code, now)
    try:
        for candidate in candidates:
            counts.seen += 1
            if on_progress and counts.seen % 500 == 0:
                on_progress(counts.seen)
            digest = content_hash(candidate.payload)
            stored = store.find_record(source_code, candidate.external_id)

            if stored is None:
                record = store.insert_record(
                    source_code=source_code,
                    external_id=candidate.external_id,
                    entity_type="UNIVERSITY_CANDIDATE",
                    payload=candidate.payload,
                    content_hash=digest,
                    seen_at=now,
                )
                counts.created += 1
                duplicates = store.find_possible_duplicates(
                    domain_of(candidate.website_url),
                    candidate.name,
                    candidate.country_code,
                    source_code,
                    candidate.external_id,
                )
                classification = candidate.payload.get("classification", "unknown")
                if duplicates:
                    reason = (
                        f"new {classification} candidate from the ROR bulk dump, possible duplicate of "
                        + "; ".join(match.describe() for match in duplicates)
                    )
                else:
                    reason = f"new {classification} candidate from the ROR bulk dump, confirm it belongs in the catalogue"
                store.queue_review(
                    record.id,
                    reason,
                    priority=1 if duplicates else 0,
                    created_at=now,
                )
            elif stored.content_hash == digest:
                store.touch_record(stored.id, now)
                counts.unchanged += 1
            else:
                store.update_record(stored.id, candidate.payload, digest, now)
                counts.updated += 1
    except Exception as exc:
        store.finish_run(run_id, "FAILED", counts, utcnow(), str(exc)[:500])
        raise

    store.finish_run(run_id, "SUCCEEDED", counts, utcnow(), None)
    return counts
