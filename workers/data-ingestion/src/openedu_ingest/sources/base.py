from __future__ import annotations

from typing import Protocol

from ..http import Fetcher
from ..models import InstitutionCandidate


class SourceAdapter(Protocol):
    """One registered source. The registry code has to match a DataSource.code in the database."""

    code: str
    entity_type: str

    def queries(self) -> list[str]:
        """What to ask the source for. Keep this list short and specific."""

    def fetch(self, query: str, fetcher: Fetcher) -> list[dict]:
        """Raw records for one query, as the source returned them."""

    def parse(self, item: dict) -> InstitutionCandidate | None:
        """Map one raw record to a candidate. None means the record is not an institution we track."""
