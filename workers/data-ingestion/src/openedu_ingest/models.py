from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass(frozen=True)
class InstitutionCandidate:
    """One institution as a source describes it, before anyone decides it belongs in the catalogue."""

    external_id: str
    name: str
    country_code: str | None = None
    city: str | None = None
    website_url: str | None = None
    institution_type: str | None = None
    aliases: tuple[str, ...] = ()
    payload: dict = field(default_factory=dict, compare=False)


@dataclass(frozen=True)
class FieldChange:
    field: str
    old_value: str | None
    new_value: str | None


@dataclass
class RunCounts:
    seen: int = 0
    created: int = 0
    updated: int = 0
    unchanged: int = 0
    rejected: int = 0

    def as_dict(self) -> dict:
        return {
            "seen": self.seen,
            "created": self.created,
            "updated": self.updated,
            "unchanged": self.unchanged,
            "rejected": self.rejected,
        }


@dataclass
class StoredRecord:
    id: str
    version: int
    content_hash: str
    payload: dict


@dataclass
class RunSummary:
    source_code: str
    run_id: str
    status: str
    counts: RunCounts
    errors: list[str] = field(default_factory=list)
    started_at: datetime | None = None
    finished_at: datetime | None = None
