from __future__ import annotations

from openedu_ingest.models import InstitutionCandidate
from openedu_ingest.validators import Severity, has_errors, validate_candidate


def candidate(**overrides) -> InstitutionCandidate:
    base = dict(
        external_id="https://ror.org/052gg0110",
        name="University of Oxford",
        country_code="GB",
        city="Oxford",
        website_url="https://www.ox.ac.uk",
        institution_type="EDUCATION",
        payload={},
    )
    base.update(overrides)
    return InstitutionCandidate(**base)


def test_a_complete_candidate_passes():
    assert validate_candidate(candidate()) == []


def test_missing_name_is_an_error():
    issues = validate_candidate(candidate(name="  "))
    assert has_errors(issues)


def test_missing_external_id_is_an_error():
    assert has_errors(validate_candidate(candidate(external_id="")))


def test_missing_city_is_only_a_warning():
    issues = validate_candidate(candidate(city=None))
    assert not has_errors(issues)
    assert [issue.field for issue in issues] == ["city"]
    assert issues[0].severity is Severity.WARNING


def test_missing_website_is_a_warning_not_an_error():
    issues = validate_candidate(candidate(website_url=None))
    assert not has_errors(issues)
    assert "website_url" in [issue.field for issue in issues]


def test_non_http_website_is_an_error():
    assert has_errors(validate_candidate(candidate(website_url="mailto:info@ox.ac.uk")))


def test_three_letter_country_code_is_flagged_but_not_fatal():
    issues = validate_candidate(candidate(country_code="GBR"))
    assert not has_errors(issues)
    assert issues[0].severity is Severity.WARNING
