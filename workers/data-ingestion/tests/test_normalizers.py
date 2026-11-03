from __future__ import annotations

import pytest

from openedu_ingest.normalizers import (
    collapse_whitespace,
    normalise_country_code,
    normalise_name,
    normalise_website,
    parse_year,
)


def test_whitespace_is_collapsed():
    assert collapse_whitespace("  University   of\tOxford \n") == "University of Oxford"


def test_name_drops_trailing_separators():
    assert normalise_name("University of Oxford, ") == "University of Oxford"


@pytest.mark.parametrize("value", ["gb", " GB ", "Gb"])
def test_country_codes_are_uppercased(value):
    assert normalise_country_code(value) == "GB"


@pytest.mark.parametrize("value", ["", None, "GBR", "1X"])
def test_country_codes_that_are_not_two_letters_are_dropped(value):
    assert normalise_country_code(value) is None


def test_website_gains_a_scheme_and_loses_a_trailing_slash():
    assert normalise_website("www.ox.ac.uk/") == "https://www.ox.ac.uk"


def test_website_host_is_lowercased():
    assert normalise_website("https://WWW.Ox.Ac.Uk/about") == "https://www.ox.ac.uk/about"


@pytest.mark.parametrize("value", ["", None, "ftp://example.org", "not a url"])
def test_unusable_websites_become_none(value):
    assert normalise_website(value) is None


@pytest.mark.parametrize(("value", "expected"), [(1096, 1096), ("1826", 1826), (12, None), ("n/a", None), (None, None)])
def test_years_are_read_only_when_plausible(value, expected):
    assert parse_year(value) == expected
