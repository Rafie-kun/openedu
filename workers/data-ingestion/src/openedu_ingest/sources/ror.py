from __future__ import annotations

from urllib.parse import quote_plus

from ..http import Fetcher
from ..models import InstitutionCandidate
from ..normalizers import normalise_country_code, normalise_name, normalise_website

API_ROOT = "https://api.ror.org/v2/organizations"


class RorAdapter:
    """Looks up institutions by name in the Research Organization Registry.

    ROR identifies research organisations. A match here says nothing about whether an
    institution awards degrees, is accredited, or belongs in the catalogue.
    """

    code = "ROR"
    entity_type = "UNIVERSITY_CANDIDATE"

    def __init__(self, queries: list[str], page_size: int = 5) -> None:
        if not queries:
            raise ValueError("the ROR adapter needs at least one query")
        self._queries = list(queries)
        self._page_size = page_size

    def queries(self) -> list[str]:
        return list(self._queries)

    def fetch(self, query: str, fetcher: Fetcher) -> list[dict]:
        # ROR treats an unquoted query loosely, so ask for the exact phrase
        phrase = quote_plus(f'"{query}"')
        url = f"{API_ROOT}?query={phrase}&page=1"
        body = fetcher.get_json(url)
        items = body.get("items")
        if not isinstance(items, list):
            return []
        return items[: self._page_size]

    def parse(self, item: dict) -> InstitutionCandidate | None:
        external_id = item.get("id")
        if not isinstance(external_id, str):
            return None

        names = item.get("names") or []
        display = _name_of_type(names, "ror_display") or _name_of_type(names, "label")
        if not display:
            return None

        aliases = tuple(
            name
            for name in (
                normalise_name(entry.get("value", ""))
                for entry in names
                if isinstance(entry, dict) and "alias" in (entry.get("types") or [])
            )
            if name and name != display
        )

        location = _first_location(item)
        payload = {
            "rorId": external_id,
            "displayName": display,
            "aliases": list(aliases),
            "city": location.get("name"),
            "countryCode": location.get("country_code"),
            "countryName": location.get("country_name"),
            "website": _website(item),
            "types": item.get("types") or [],
            "status": item.get("status"),
            "lastModified": (item.get("admin") or {}).get("last_modified", {}).get("date"),
        }

        return InstitutionCandidate(
            external_id=external_id,
            name=display,
            country_code=normalise_country_code(location.get("country_code")),
            city=normalise_name(location.get("name", "")) or None,
            website_url=normalise_website(_website(item)),
            institution_type="EDUCATION" if "education" in (item.get("types") or []) else None,
            aliases=aliases,
            payload=payload,
        )


def _name_of_type(names: list, wanted: str) -> str | None:
    for entry in names:
        if isinstance(entry, dict) and wanted in (entry.get("types") or []):
            value = normalise_name(entry.get("value", ""))
            if value:
                return value
    return None


def _first_location(item: dict) -> dict:
    locations = item.get("locations") or []
    if not locations:
        return {}
    details = locations[0].get("geonames_details") or {}
    return details if isinstance(details, dict) else {}


def _website(item: dict) -> str | None:
    for link in item.get("links") or []:
        if isinstance(link, dict) and link.get("type") == "website":
            return link.get("value")
    return None
