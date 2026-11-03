from __future__ import annotations

import os
from dataclasses import dataclass

DEFAULT_USER_AGENT = "OpenEdu/0.1 (+https://github.com/Rafie-kun/openedu)"


@dataclass(frozen=True)
class Settings:
    database_url: str | None
    user_agent: str
    timeout_seconds: float
    min_interval_seconds: float
    max_attempts: int


def load_settings(environ: dict[str, str] | None = None) -> Settings:
    env = os.environ if environ is None else environ
    return Settings(
        database_url=env.get("DATABASE_URL") or None,
        user_agent=env.get("INGEST_USER_AGENT", DEFAULT_USER_AGENT),
        timeout_seconds=float(env.get("INGEST_TIMEOUT_SECONDS", "30")),
        min_interval_seconds=float(env.get("INGEST_MIN_INTERVAL_SECONDS", "1")),
        max_attempts=int(env.get("INGEST_MAX_ATTEMPTS", "3")),
    )
