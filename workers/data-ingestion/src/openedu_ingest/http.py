from __future__ import annotations

import ipaddress
import json
import socket
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from typing import Callable
from urllib.parse import urlparse

Transport = Callable[[str, dict[str, str], float], tuple[int, bytes]]


class SourceError(RuntimeError):
    """A source could not be read. Callers record it and move on to the next query."""


def _is_safe_url(url: str) -> bool:
    """Validate that a URL is safe to fetch (not pointing to internal/private networks).
    Prevents Server-Side Request Forgery (SSRF) attacks against metadata endpoints,
    private cloud instances, internal services, and localhost.
    """
    try:
        parsed = urlparse(url)
    except Exception:
        return False

    if parsed.scheme not in ("http", "https"):
        return False

    hostname = parsed.hostname
    if not hostname:
        return False

    if hostname.lower() in ("localhost", "::1"):
        return False

    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_loopback or ip.is_private or ip.is_link_local or ip.is_reserved:
            return False
    except ValueError:
        try:
            info = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
            for family, socktype, proto, canonname, sockaddr in info:
                ip_str = sockaddr[0]
                ip = ipaddress.ip_address(ip_str)
                if ip.is_loopback or ip.is_private or ip.is_link_local or ip.is_reserved:
                    return False
        except Exception:
            pass

    return True


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
        if not _is_safe_url(url):
            raise SourceError(f"URL is not allowed (internal/private network): {url}")

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
