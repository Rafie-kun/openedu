from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from typing import Callable

Transport = Callable[[str, dict[str, str], float], tuple[int, bytes]]


class SourceError(RuntimeError):
    """A source could not be read. Callers record it and move on to the next query."""


def _urllib_transport(url: str, headers: dict[str, str], timeout: float) -> tuple[int, bytes]:
    request = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read()


# statuses that will not improve by asking again
PERMANENT_FAILURES = {400, 401, 403, 404, 410, 451}


@dataclass
class Fetcher:
    user_agent: str
    timeout_seconds: float = 30.0
    min_interval_seconds: float = 1.0
    max_attempts: int = 3
    transport: Transport | None = None
    _last_request_at: float = field(default=0.0, repr=False)

    def get_json(self, url: str) -> dict:
        body = self.get_bytes(url)
        try:
            return json.loads(body)
        except json.JSONDecodeError as exc:
            raise SourceError(f"{url} returned something that is not JSON: {exc}") from exc

    def get_bytes(self, url: str) -> bytes:
        transport = self.transport or _urllib_transport
        headers = {
            "User-Agent": self.user_agent,
            "Accept": "application/json",
        }
        last_error: SourceError | None = None

        for attempt in range(1, self.max_attempts + 1):
            self._pace()
            try:
                status, body = transport(url, headers, self.timeout_seconds)
            except OSError as exc:
                last_error = SourceError(f"{url} could not be reached: {exc}")
            else:
                if 200 <= status < 300:
                    return body
                last_error = SourceError(f"{url} returned HTTP {status}")
                if status in PERMANENT_FAILURES:
                    raise last_error

            if attempt < self.max_attempts:
                time.sleep(min(2 ** (attempt - 1), 8))

        raise last_error or SourceError(f"{url} failed without a response")

    def _pace(self) -> None:
        if self.min_interval_seconds <= 0:
            return
        elapsed = time.monotonic() - self._last_request_at
        remaining = self.min_interval_seconds - elapsed
        if remaining > 0:
            time.sleep(remaining)
        self._last_request_at = time.monotonic()
