"""Tests for write_nav in scraper/writer.py."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from scraper.nav_extractor import NavItem
from scraper.writer import write_nav

_ITEM_A = NavItem(label="Inicio", href="/")
_ITEM_B = NavItem(label="Calendario", href="/calendario")
_ITEM_C = NavItem(label="Eventos", href="/eventos")

_ITEMS = (_ITEM_A, _ITEM_B, _ITEM_C)
_NAV_JSON = "_nav.json"
_TMP_NAV_JSON = "_nav.json.tmp"


class TestWriteNav:
    # ------------------------------------------------------------------
    # Happy path
    # ------------------------------------------------------------------

    def test_creates_nav_json_with_expected_shape(self, tmp_path: Path) -> None:
        sha = write_nav(_ITEMS, tmp_path)
        dest = tmp_path / _NAV_JSON
        assert dest.exists()
        payload = json.loads(dest.read_bytes())
        assert payload["version"] == 1
        assert "generated_at" in payload
        assert payload["items"] == [
            {"href": "/", "label": "Inicio"},
            {"href": "/calendario", "label": "Calendario"},
            {"href": "/eventos", "label": "Eventos"},
        ]
        assert sha is not None
        assert len(sha) == 64  # SHA-256 hex

    def test_serialises_children_when_present(self, tmp_path: Path) -> None:
        items = (
            NavItem(
                label="Eventos",
                href="/eventos",
                children=(
                    NavItem(label="Festa Major", href="/eventos/festa-major"),
                    NavItem(label="24h", href="/eventos/24h-mesa"),
                ),
            ),
            NavItem(label="Inicio", href="/"),
        )
        write_nav(items, tmp_path)
        payload = json.loads((tmp_path / _NAV_JSON).read_bytes())
        assert payload["items"] == [
            {
                "href": "/eventos",
                "label": "Eventos",
                "children": [
                    {"href": "/eventos/festa-major", "label": "Festa Major"},
                    {"href": "/eventos/24h-mesa", "label": "24h"},
                ],
            },
            {"href": "/", "label": "Inicio"},
        ]

    def test_omits_children_key_when_empty(self, tmp_path: Path) -> None:
        write_nav((NavItem(label="Inicio", href="/"),), tmp_path)
        payload = json.loads((tmp_path / _NAV_JSON).read_bytes())
        assert payload["items"] == [{"href": "/", "label": "Inicio"}]
        assert "children" not in payload["items"][0]

    def test_returns_sha256_matching_file_bytes(self, tmp_path: Path) -> None:
        import hashlib

        sha = write_nav(_ITEMS, tmp_path)
        file_bytes = (tmp_path / _NAV_JSON).read_bytes()
        assert sha == hashlib.sha256(file_bytes).hexdigest()

    def test_no_tmp_file_left_after_successful_write(self, tmp_path: Path) -> None:
        write_nav(_ITEMS, tmp_path)
        assert not (tmp_path / _TMP_NAV_JSON).exists()

    def test_iso8601_generated_at(self, tmp_path: Path) -> None:
        from datetime import datetime

        write_nav(_ITEMS, tmp_path)
        payload = json.loads((tmp_path / _NAV_JSON).read_bytes())
        # datetime.fromisoformat raises if the string is malformed
        dt = datetime.fromisoformat(payload["generated_at"])
        assert dt.tzinfo is not None  # UTC-aware

    # ------------------------------------------------------------------
    # Empty items
    # ------------------------------------------------------------------

    def test_empty_items_does_not_create_nav_json(self, tmp_path: Path) -> None:
        result = write_nav((), tmp_path)
        assert result is None
        assert not (tmp_path / _NAV_JSON).exists()

    def test_empty_items_returns_none(self, tmp_path: Path) -> None:
        assert write_nav((), tmp_path) is None

    def test_empty_items_emits_warning(
        self, tmp_path: Path, caplog: pytest.LogCaptureFixture
    ) -> None:
        import logging

        with caplog.at_level(logging.WARNING, logger="scraper.writer"):
            write_nav((), tmp_path)
        assert any("no items" in record.message for record in caplog.records)

    # ------------------------------------------------------------------
    # Pre-existing file handling
    # ------------------------------------------------------------------

    def test_successful_write_replaces_existing_nav_json(self, tmp_path: Path) -> None:
        (tmp_path / _NAV_JSON).write_text("old content", encoding="utf-8")
        write_nav(_ITEMS, tmp_path)
        payload = json.loads((tmp_path / _NAV_JSON).read_bytes())
        assert payload["version"] == 1
        assert payload["items"][0]["label"] == "Inicio"

    def test_empty_items_leaves_existing_nav_json_unchanged(
        self, tmp_path: Path
    ) -> None:
        original = '{"version":1,"generated_at":"2025-01-01T00:00:00+00:00","items":[]}'
        (tmp_path / _NAV_JSON).write_text(original, encoding="utf-8")
        write_nav((), tmp_path)
        assert (tmp_path / _NAV_JSON).read_text(encoding="utf-8") == original
