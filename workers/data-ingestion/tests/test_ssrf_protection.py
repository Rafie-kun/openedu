"""Tests for SSRF (Server-Side Request Forgery) protection in the HTTP fetcher."""

from __future__ import annotations

import pytest

from openedu_ingest.http import Fetcher, SourceError


def test_rejects_localhost_http():
    fetcher = Fetcher(user_agent="test")
    with pytest.raises(SourceError, match="not allowed"):
        fetcher.get_bytes("http://localhost:8080/api")


def test_rejects_localhost_explicit_ip():
    fetcher = Fetcher(user_agent="test")
    with pytest.raises(SourceError, match="not allowed"):
        fetcher.get_bytes("http://127.0.0.1/data")


def test_rejects_private_rfc1918():
    fetcher = Fetcher(user_agent="test")
    with pytest.raises(SourceError, match="not allowed"):
        fetcher.get_bytes("http://192.168.1.1/")

    with pytest.raises(SourceError, match="not allowed"):
        fetcher.get_bytes("http://10.0.0.1/")

    with pytest.raises(SourceError, match="not allowed"):
        fetcher.get_bytes("http://172.16.0.1/")


def test_rejects_link_local():
    fetcher = Fetcher(user_agent="test")
    with pytest.raises(SourceError, match="not allowed"):
        fetcher.get_bytes("http://169.254.169.254/")  # AWS metadata


def test_rejects_non_http_protocols():
    fetcher = Fetcher(user_agent="test")
    with pytest.raises(SourceError, match="not allowed"):
        fetcher.get_bytes("file:///etc/passwd")

    with pytest.raises(SourceError, match="not allowed"):
        fetcher.get_bytes("ftp://example.com/data")


def test_allows_safe_public_urls():
    """These URLs pass validation (they would fail on network issues, not SSRF checks)."""
    fetcher = Fetcher(user_agent="test", max_attempts=1)

    safe_urls = [
        "https://api.ror.org/v2/organizations",
        "https://raw.githubusercontent.com/Rafie-kun/example/main/data.json",
        "https://api.openalex.org/institutions",
        "https://www.example.com/data",
    ]

    for url in safe_urls:
        try:
            fetcher.get_bytes(url)
        except SourceError as e:
            if "not allowed" in str(e):
                pytest.fail(f"Safe URL rejected: {url}: {e}")


def test_rejects_ipv6_loopback():
    fetcher = Fetcher(user_agent="test")
    with pytest.raises(SourceError, match="not allowed"):
        fetcher.get_bytes("http://[::1]/api")


def test_rejects_ipv6_private():
    fetcher = Fetcher(user_agent="test")
    with pytest.raises(SourceError, match="not allowed"):
        fetcher.get_bytes("http://[fd00::1]/api")  # Unique local address
