from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from .models import InstitutionCandidate
from .normalizers import normalise_country_code, normalise_website


class Severity(str, Enum):
    ERROR = "error"
    WARNING = "warning"


@dataclass(frozen=True)
class Issue:
    field: str
    message: str
    severity: Severity = Severity.ERROR

    def __str__(self) -> str:
        return f"{self.severity.value}: {self.field} {self.message}"


def validate_candidate(candidate: InstitutionCandidate) -> list[Issue]:
    issues: list[Issue] = []

    if not candidate.external_id.strip():
        issues.append(Issue("external_id", "is empty"))
    if not candidate.name.strip():
        issues.append(Issue("name", "is empty"))
    elif len(candidate.name) > 400:
        issues.append(Issue("name", "is longer than 400 characters"))

    if candidate.country_code and normalise_country_code(candidate.country_code) is None:
        issues.append(Issue("country_code", "is not a two-letter code", Severity.WARNING))

    if candidate.website_url:
        if normalise_website(candidate.website_url) is None:
            issues.append(Issue("website_url", "is not an http(s) address"))

    if not candidate.city:
        issues.append(Issue("city", "is missing, a human has to fill it in", Severity.WARNING))

    if not candidate.website_url:
        issues.append(Issue("website_url", "is missing, cannot be published without one", Severity.WARNING))

    return issues


def has_errors(issues: list[Issue]) -> bool:
    return any(issue.severity is Severity.ERROR for issue in issues)
