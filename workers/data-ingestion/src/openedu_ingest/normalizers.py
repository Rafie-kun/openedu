from __future__ import annotations

import re
from urllib.parse import urlsplit, urlunsplit

_WHITESPACE = re.compile(r"\s+")
_COUNTRY_CODE = re.compile(r"^[A-Za-z]{2}$")
_HOSTNAME = re.compile(r"^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$")


def collapse_whitespace(value: str) -> str:
    return _WHITESPACE.sub(" ", value).strip()


def normalise_name(value: str) -> str:
    return collapse_whitespace(value).rstrip(",;")


def normalise_country_code(value: str | None) -> str | None:
    """Returns an ISO 3166-1 alpha-2 code, or None when the value is not one."""
    if not value:
        return None
    candidate = value.strip().upper()
    if not _COUNTRY_CODE.match(candidate):
        return None
    return candidate


def normalise_website(value: str | None) -> str | None:
    if not value:
        return None
    raw = value.strip()
    parts = urlsplit(raw if "//" in raw else f"https://{raw}")
    if parts.scheme not in {"http", "https"} or not parts.netloc:
        return None
    host = parts.netloc.lower()
    if not _HOSTNAME.match(host):
        return None
    path = parts.path.rstrip("/")
    return urlunsplit((parts.scheme, host, path, parts.query, ""))


def domain_of(url: str | None) -> str | None:
    """Lowercased hostname with any leading 'www.' stripped, for duplicate matching."""
    canonical = normalise_website(url)
    if not canonical:
        return None
    host = urlsplit(canonical).netloc.lower()
    return host.removeprefix("www.") or None


def parse_year(value: object) -> int | None:
    if isinstance(value, int):
        return value if 1000 <= value <= 2200 else None
    if isinstance(value, str) and value.strip().isdigit():
        year = int(value.strip())
        return year if 1000 <= year <= 2200 else None
    return None
