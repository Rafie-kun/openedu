from __future__ import annotations

from openedu_ingest.change_detection import content_hash, diff_payload


def test_hash_ignores_key_order():
    assert content_hash({"a": 1, "b": 2}) == content_hash({"b": 2, "a": 1})


def test_hash_changes_with_values():
    assert content_hash({"name": "Oxford"}) != content_hash({"name": "Cambridge"})


def test_diff_reports_only_changed_fields():
    old = {"name": "Oxford", "city": "Oxford", "website": "https://www.ox.ac.uk"}
    new = {"name": "University of Oxford", "city": "Oxford", "website": "https://www.ox.ac.uk"}
    changes = diff_payload(old, new, ("name", "city", "website"))
    assert [(change.field, change.old_value, change.new_value) for change in changes] == [
        ("name", "Oxford", "University of Oxford")
    ]


def test_diff_keeps_missing_values_as_none():
    changes = diff_payload({"city": "Oxford"}, {"city": None}, ("city",))
    assert changes[0].new_value is None


def test_diff_flattens_lists_for_the_log():
    changes = diff_payload({"types": ["education"]}, {"types": ["education", "funder"]}, ("types",))
    assert changes[0].old_value == "education"
    assert changes[0].new_value == "education, funder"


def test_no_difference_produces_no_changes():
    payload = {"name": "Oxford", "types": ["education"]}
    assert diff_payload(payload, dict(payload), ("name", "types")) == []
