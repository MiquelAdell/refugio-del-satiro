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
from scraper.manifest import Manifest, PageRecord
from scraper.orchestrator import run
from scraper.writer import write_manifest

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
_OUTPUT_FILE = "index.html"
_SESSION_IMAGE_URL = (
    "https://sites.google.com/u/0/sitesv-images-rt/"
    "AMxu72u5T6YlyI1FLbjF0O7HQOXCanRUzt44pqY3NyFxozSGzLlLeGo4YdS8"
)

_ROOT_HTML_WITH_SESSION_IMAGE = _ROOT_HTML.replace(
    "Main content area",
    f'<img alt="Source image" src="{_SESSION_IMAGE_URL}">',
)


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


def _make_fetcher_mock_with_asset_failure(html: str) -> MagicMock:
    fetcher_instance = AsyncMock()
    fetcher_instance.get = AsyncMock(
        side_effect=(_fetch_result(html), RuntimeError("image returned 403"))
    )
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

    @pytest.mark.asyncio
    async def test_asset_failure_preserves_previous_page(self, tmp_path: Path) -> None:
        previous_content = "<html><body>Previous safe mirror</body></html>"
        (tmp_path / _OUTPUT_FILE).write_text(previous_content, encoding="utf-8")
        previous_page = PageRecord(
            url="https://www.refugiodelsatiro.es/",
            path="/",
            output_file=_OUTPUT_FILE,
            title="Previous page",
            content_sha256="previous-sha",
            asset_filenames=("previous-image.jpg",),
            scraped_at="2026-09-20T00:00:00+00:00",
            nav_sha256=None,
        )
        write_manifest(
            tmp_path,
            Manifest(generated_at="2026-09-20T00:00:00+00:00", pages=(previous_page,)),
            "_manifest.json",
        )
        config = _make_config(tmp_path)
        enumeration = EnumerationResult(
            pages=(_ROOT_PAGE,),
            missing_required=(),
            unexpected_paths=(),
        )

        with (
            patch(
                "scraper.orchestrator.Fetcher",
                return_value=_make_fetcher_mock_with_asset_failure(
                    _ROOT_HTML_WITH_SESSION_IMAGE
                ),
            ),
            patch(
                "scraper.orchestrator.enumerate_pages",
                new=AsyncMock(return_value=enumeration),
            ),
        ):
            summary = await run(config)

        assert summary.errors == 1
        assert (tmp_path / _OUTPUT_FILE).read_text(encoding="utf-8") == previous_content
