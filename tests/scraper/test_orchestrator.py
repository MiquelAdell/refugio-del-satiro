"""Integration tests for the nav-extraction hook in scraper/orchestrator.py.

These tests stub the network layer (Fetcher + enumerator) so no real HTTP
calls are made. A minimal fixture HTML that satisfies the stripper's sanity
check is served for the root page.
"""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from scraper.config import ScraperConfig
from scraper.enumerator import DiscoveredPage, EnumerationResult
from scraper.fetcher import FetchResult
from scraper.orchestrator import run

# ---------------------------------------------------------------------------
# Fixture HTML
# ---------------------------------------------------------------------------

# Minimal Google Sites page body that passes the stripper's sanity selector
# (`div[jsname="ZBtY8b"]`) and contains a nav with recognisable top-level items.
_ROOT_HTML = """\
<!doctype html>
<html>
<head><title>Home - El Refugio del Sátiro</title></head>
<body>
<header id="atIdViewHeader">
  <nav id="yuynLe" class="JzO0Vc">
    <ul class="jYxBte Fpy8Db">
      <li><a href="https://www.refugiodelsatiro.es/inicio">Inicio</a></li>
      <li><a href="https://www.refugiodelsatiro.es/calendario">Calendario</a></li>
      <li><a href="https://www.refugiodelsatiro.es/eventos">Eventos</a></li>
      <li><a href="https://www.refugiodelsatiro.es/prestamos">Préstamos</a></li>
    </ul>
  </nav>
</header>
<div jsname="ZBtY8b">Main content area</div>
</body>
</html>
"""

# Root page with no nav items (empty ul) to simulate extraction failure.
_ROOT_HTML_EMPTY_NAV = """\
<!doctype html>
<html>
<head><title>Home - El Refugio del Sátiro</title></head>
<body>
<header id="atIdViewHeader">
  <nav id="yuynLe" class="JzO0Vc">
    <ul class="jYxBte Fpy8Db">
    </ul>
  </nav>
</header>
<div jsname="ZBtY8b">Main content area</div>
</body>
</html>
"""

_ROOT_PAGE = DiscoveredPage(canonical_path="/", source_path="/")

_NAV_JSON = "_nav.json"


def _make_config(tmp_path: Path) -> ScraperConfig:
    return ScraperConfig(
        origin="https://www.refugiodelsatiro.es",
        output_dir=tmp_path,
        assets_subdir="_assets",
        manifest_file="_manifest.json",
    )


def _fetch_result(
    body: str, url: str = "https://www.refugiodelsatiro.es/"
) -> FetchResult:
    return FetchResult(
        url=url,
        status=200,
        body=body.encode("utf-8"),
        content_type="text/html; charset=utf-8",
    )


# ---------------------------------------------------------------------------
# Helpers: mock the async Fetcher context manager
# ---------------------------------------------------------------------------


def _make_fetcher_mock(html: str) -> MagicMock:
    """Return a context-manager mock whose `get()` returns *html*."""
    fetcher_instance = AsyncMock()
    fetcher_instance.get = AsyncMock(return_value=_fetch_result(html))
    fetcher_cm = MagicMock()
    fetcher_cm.__aenter__ = AsyncMock(return_value=fetcher_instance)
    fetcher_cm.__aexit__ = AsyncMock(return_value=False)
    return fetcher_cm


class TestOrchestratorNavExtraction:
    # ------------------------------------------------------------------
    # Happy path
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_nav_json_written_after_root_scrape(self, tmp_path: Path) -> None:
        config = _make_config(tmp_path)
        enumeration = EnumerationResult(
            pages=(_ROOT_PAGE,),
            missing_required=(),
            unexpected_paths=(),
        )
        with (
            patch(
                "scraper.orchestrator.Fetcher",
                return_value=_make_fetcher_mock(_ROOT_HTML),
            ),
            patch(
                "scraper.orchestrator.enumerate_pages",
                new=AsyncMock(return_value=enumeration),
            ),
        ):
            await run(config)

        nav_file = tmp_path / _NAV_JSON
        assert nav_file.exists()
        payload = json.loads(nav_file.read_bytes())
        assert payload["version"] == 1
        assert "generated_at" in payload
        items = payload["items"]
        # /prestamos must be excluded; /inicio is rewritten to / by the linker.
        hrefs = [item["href"] for item in items]
        assert "/prestamos" not in hrefs
        assert len(items) >= 1

    @pytest.mark.asyncio
    async def test_nav_json_has_expected_schema(self, tmp_path: Path) -> None:
        config = _make_config(tmp_path)
        enumeration = EnumerationResult(
            pages=(_ROOT_PAGE,),
            missing_required=(),
            unexpected_paths=(),
        )
        with (
            patch(
                "scraper.orchestrator.Fetcher",
                return_value=_make_fetcher_mock(_ROOT_HTML),
            ),
            patch(
                "scraper.orchestrator.enumerate_pages",
                new=AsyncMock(return_value=enumeration),
            ),
        ):
            await run(config)

        payload = json.loads((tmp_path / _NAV_JSON).read_bytes())
        assert set(payload.keys()) >= {"version", "generated_at", "items"}
        for item in payload["items"]:
            assert "label" in item
            assert "href" in item

    # ------------------------------------------------------------------
    # Extraction failure leaves existing file untouched
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_empty_nav_leaves_existing_nav_json_unchanged(
        self, tmp_path: Path
    ) -> None:
        old_content = (
            '{"version":1,"generated_at":"2025-01-01T00:00:00+00:00","items":[]}'
        )
        (tmp_path / _NAV_JSON).write_text(old_content, encoding="utf-8")

        config = _make_config(tmp_path)
        enumeration = EnumerationResult(
            pages=(_ROOT_PAGE,),
            missing_required=(),
            unexpected_paths=(),
        )
        with (
            patch(
                "scraper.orchestrator.Fetcher",
                return_value=_make_fetcher_mock(_ROOT_HTML_EMPTY_NAV),
            ),
            patch(
                "scraper.orchestrator.enumerate_pages",
                new=AsyncMock(return_value=enumeration),
            ),
        ):
            await run(config)

        assert (tmp_path / _NAV_JSON).read_text(encoding="utf-8") == old_content

    @pytest.mark.asyncio
    async def test_empty_nav_does_not_create_nav_json_if_absent(
        self, tmp_path: Path
    ) -> None:
        config = _make_config(tmp_path)
        enumeration = EnumerationResult(
            pages=(_ROOT_PAGE,),
            missing_required=(),
            unexpected_paths=(),
        )
        with (
            patch(
                "scraper.orchestrator.Fetcher",
                return_value=_make_fetcher_mock(_ROOT_HTML_EMPTY_NAV),
            ),
            patch(
                "scraper.orchestrator.enumerate_pages",
                new=AsyncMock(return_value=enumeration),
            ),
        ):
            await run(config)

        assert not (tmp_path / _NAV_JSON).exists()

    # ------------------------------------------------------------------
    # Non-root pages do not trigger nav write
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_non_root_page_does_not_write_nav_json(self, tmp_path: Path) -> None:
        non_root_page = DiscoveredPage(
            canonical_path="/calendario", source_path="/calendario"
        )
        config = _make_config(tmp_path)
        enumeration = EnumerationResult(
            pages=(non_root_page,),
            missing_required=(),
            unexpected_paths=(),
        )
        with (
            patch(
                "scraper.orchestrator.Fetcher",
                return_value=_make_fetcher_mock(_ROOT_HTML),
            ),
            patch(
                "scraper.orchestrator.enumerate_pages",
                new=AsyncMock(return_value=enumeration),
            ),
        ):
            await run(config)

        assert not (tmp_path / _NAV_JSON).exists()
