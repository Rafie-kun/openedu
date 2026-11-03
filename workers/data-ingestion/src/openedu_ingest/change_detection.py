from __future__ import annotations

import hashlib
import json
from typing import Iterable

from .models import FieldChange


def content_hash(payload: dict) -> str:
    """Stable hash of a source payload, so an unchanged record is not rewritten."""
    canonical = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def diff_payload(
    old: dict,
    new: dict,
    fields: Iterable[str],
) -> list[FieldChange]:
    changes: list[FieldChange] = []
    for field in fields:
        before = _plain(old.get(field))
        after = _plain(new.get(field))
        if before != after:
            changes.append(FieldChange(field=field, old_value=before, new_value=after))
    return changes


def _plain(value: object) -> str | None:
    if value is None:
        return None
    if isinstance(value, (list, tuple)):
        return ", ".join(str(item) for item in value) or None
    return str(value)
