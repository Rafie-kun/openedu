from __future__ import annotations

from urllib.parse import quote_plus

from ..http import Fetcher
from ..models import InstitutionCandidate
from ..normalizers import normalise_country_code, normalise_name, normalise_website

API_ROOT = "https://api.openalex.org/institutions"


class OpenAlexAdapter:
    """Looks up institutions by name in OpenAlex.

    Like ROR, OpenAlex tracks research output, not degree-awarding status or accreditation.
    A match here is a candidate, nothing more.
    """

    code = "OPENALEX"
    entity_type = "UNIVERSITY_CANDIDATE"

    def __init__(self, queries: list[str], page_size: int = 5, mailto: str | None = None) -> None:
        if not queries:
            raise ValueError("the OpenAlex adapter needs at least one query")
        self._queries = list(queries)
        self._page_size = page_size
        self._mailto = mailto

    def queries(self) -> list[str]:
        return list(self._queries)

    def fetch(self, query: str, fetcher: Fetcher) -> list[dict]:
        params = f"search={quote_plus(query)}&per-page={self._page_size}"
        if self._mailto:
            params += f"&mailto={quote_plus(self._mailto)}"
        body = fetcher.get_json(f"{API_ROOT}?{params}")
        results = body.get("results")
        if not isinstance(results, list):
            return []
        return results

    def parse(self, item: dict) -> InstitutionCandidate | None:
        external_id = item.get("id")
        display = item.get("display_name")
        if not isinstance(external_id, str) or not isinstance(display, str) or not display.strip():
            return None

        display = normalise_name(display)
        aliases = tuple(
            name
            for name in (normalise_name(alt) for alt in (item.get("display_name_alternatives") or []))
            if name and name != display
        )

        geo = item.get("geo") or {}
        payload = {
            "openalexId": external_id,
            "rorId": item.get("ror"),
            "displayName": display,
            "aliases": list(aliases),
            "city": geo.get("city"),
            "countryCode": geo.get("country_code"),
            "countryName": geo.get("country"),
            "website": item.get("homepage_url"),
            "type": item.get("type"),
            "worksCount": item.get("works_count"),
            "updatedDate": item.get("updated_date"),
        }

        return InstitutionCandidate(
            external_id=external_id,
            name=display,
            country_code=normalise_country_code(geo.get("country_code")),
            city=normalise_name(geo.get("city", "")) or None,
            website_url=normalise_website(item.get("homepage_url")),
            institution_type="EDUCATION" if item.get("type") == "education" else None,
            aliases=aliases,
            payload=payload,
        )
