from __future__ import annotations

import hashlib

from ..http import Fetcher
from ..models import InstitutionCandidate
from ..normalizers import normalise_name, normalise_website

# Same owner as this project (Rafie-kun), MIT licensed. See docs/somnia-migration-audit.md: every
# numeric field in this dataset (ranking, acceptance rate, GPA, tuition, majors, scholarships,
# applicationUrl) was confirmed randomly generated. Only name/country/city/website are extracted.
RAW_URL = (
    "https://raw.githubusercontent.com/Rafie-kun/rafie-kun.scolarship-app/main/"
    "public/data/universities.json"
)

# Covers the 60 country names actually present in the legacy file (checked at audit time). A name
# not in this table is kept as free text for a human to resolve, not guessed.
_COUNTRY_NAME_TO_ISO2 = {
    "united kingdom": "GB",
    "united states": "US",
    "canada": "CA",
    "france": "FR",
    "switzerland": "CH",
    "germany": "DE",
    "singapore": "SG",
    "australia": "AU",
    "japan": "JP",
    "netherlands": "NL",
    "sweden": "SE",
    "china": "CN",
    "south korea": "KR",
    "hong kong": "HK",
    "new zealand": "NZ",
    "ireland": "IE",
    "italy": "IT",
    "spain": "ES",
    "belgium": "BE",
    "denmark": "DK",
    "norway": "NO",
    "finland": "FI",
    "austria": "AT",
    "india": "IN",
    "south africa": "ZA",
    "brazil": "BR",
    "mexico": "MX",
    "argentina": "AR",
    "chile": "CL",
    "poland": "PL",
    "portugal": "PT",
    "israel": "IL",
    "malaysia": "MY",
    "taiwan": "TW",
    "thailand": "TH",
    "indonesia": "ID",
    "philippines": "PH",
    "vietnam": "VN",
    "turkey": "TR",
    "russia": "RU",
    "united arab emirates": "AE",
    "saudi arabia": "SA",
    "egypt": "EG",
    "nigeria": "NG",
    "kenya": "KE",
    "czech republic": "CZ",
    "czechia": "CZ",
    "hungary": "HU",
    "greece": "GR",
    "romania": "RO",
    "ukraine": "UA",
    "iceland": "IS",
    "luxembourg": "LU",
    "qatar": "QA",
    "colombia": "CO",
    "peru": "PE",
    "bangladesh": "BD",
    "pakistan": "PK",
    "sri lanka": "LK",
    "nepal": "NP",
}


def _identity_key(name: str, country: str) -> str:
    return f"{normalise_name(name).lower()}|{normalise_name(country).lower()}"


def _external_id(identity_key: str) -> str:
    digest = hashlib.sha256(identity_key.encode("utf-8")).hexdigest()[:16]
    return f"somnia:{digest}"


class SomniaLegacyAdapter:
    """Groups the legacy Somnia universities.json into unique institution identities.

    The committed file has 253 records for 61 unique (name, country) identities - up to 30
    near-duplicate rows per institution, each carrying different randomly generated numeric values
    (see docs/somnia-migration-audit.md). This adapter only ever extracts name, country, city and
    website; every other legacy field is read only to detect disagreement, never stored as fact.
    """

    code = "SOMNIA_LEGACY"
    entity_type = "UNIVERSITY_CANDIDATE"

    def __init__(self, queries: list[str] | None = None, source_url: str = RAW_URL) -> None:
        self._queries = list(queries) if queries else ["universities"]
        self._source_url = source_url

    def queries(self) -> list[str]:
        return list(self._queries)

    def fetch(self, query: str, fetcher: Fetcher) -> list[dict]:
        body = fetcher.get_json(self._source_url)
        records = body if isinstance(body, list) else []

        groups: dict[str, dict] = {}
        for record in records:
            if not isinstance(record, dict):
                continue
            name = record.get("name")
            country = record.get("country")
            if not isinstance(name, str) or not name.strip():
                continue
            if not isinstance(country, str) or not country.strip():
                continue

            key = _identity_key(name, country)
            group = groups.setdefault(
                key,
                {
                    "identityKey": key,
                    "name": normalise_name(name),
                    "country": normalise_name(country),
                    "cities": [],
                    "websites": [],
                    "legacyIds": [],
                },
            )
            group["legacyIds"].append(record.get("id"))
            city = record.get("city")
            if isinstance(city, str) and city.strip() and city not in group["cities"]:
                group["cities"].append(city)
            website = record.get("website")
            if isinstance(website, str) and website.strip() and website not in group["websites"]:
                group["websites"].append(website)

        return list(groups.values())

    def parse(self, item: dict) -> InstitutionCandidate | None:
        name = item.get("name")
        country = item.get("country")
        identity_key = item.get("identityKey")
        if not isinstance(name, str) or not isinstance(country, str) or not isinstance(identity_key, str):
            return None

        cities = item.get("cities") or []
        websites = item.get("websites") or []
        city = cities[0] if cities else None
        website = websites[0] if websites else None
        legacy_ids = [i for i in (item.get("legacyIds") or []) if isinstance(i, str)]

        country_code = _COUNTRY_NAME_TO_ISO2.get(country.lower())

        payload = {
            "displayName": name,
            "city": city,
            "countryCode": country_code,
            "countryName": country,
            "website": website,
            "types": [],
            "status": "legacy_candidate",
            "legacySourceRepo": "Rafie-kun/rafie-kun.scolarship-app",
            "legacyIdentityKey": identity_key,
            "legacyRecordIds": legacy_ids,
            "legacyRecordCount": len(legacy_ids),
            "legacyConflictingCities": cities[1:] if len(cities) > 1 else [],
            "legacyConflictingWebsites": websites[1:] if len(websites) > 1 else [],
        }

        return InstitutionCandidate(
            external_id=_external_id(identity_key),
            name=name,
            country_code=country_code,
            city=normalise_name(city) if city else None,
            website_url=normalise_website(website) if website else None,
            institution_type=None,
            aliases=(),
            payload=payload,
        )
