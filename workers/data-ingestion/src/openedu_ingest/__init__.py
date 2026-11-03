"""Ingestion pipeline for OpenEdu.

Fetches from registered sources, normalises and validates records, detects changes
against what was seen before, and hands everything that differs to a review queue.
It never writes to the public catalogue tables.
"""
