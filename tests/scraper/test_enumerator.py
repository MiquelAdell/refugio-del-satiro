"""Tests for scraper/enumerator.py, focused on nav-derived required paths.

Regression coverage for the fix that replaced the hardcoded `REQUIRED_PATHS`
constant with paths derived live from the homepage's `<nav id="yuynLe">`.
The network layer (`Fetcher.get`) is faked entirely — no real HTTP calls.
"""

from __future__ import annotations

from urllib.parse import urlparse

import pytest

from scraper.config import SKIP_PATHS, ScraperConfig
from scraper.enumerator import DiscoveredPage, EnumerationResult, enumerate_pages
from scraper.fetcher import FetchResult

# ---------------------------------------------------------------------------
# HTML fixture builders (mirrors the markup shape from test_nav_extractor.py)
# ---------------------------------------------------------------------------

_ORIGIN = "https://example.test"

_PAGE_TEMPLATE = """\
<!doctype html>
<html><body>
{nav}
{body_links}
</body></html>
"""

_NAV_TEMPLATE = """\
<nav id="yuynLe">
  <ul>
    {items}
  </ul>
</nav>
"""

_ANCHOR = "<a href='{href}'>{label}</a>"


def _nav_li(label: str, href: str, *children: tuple[str, str]) -> str:
    head = _ANCHOR.format(href=href, label=label)
    rest = "".join(_ANCHOR.format(href=c_href, label=c_label) for c_label, c_href in children)
    return f"<li><div>{head}</div>{rest}</li>"


def _nav_html(*items: tuple[str, str, tuple[tuple[str, str], ...]]) -> str:
    """Build a `<nav id="yuynLe">` block. Each item is (label, href, children)."""
    rendered = "\n    ".join(_nav_li(label, href, *children) for label, href, children in items)
    return _NAV_TEMPLATE.format(items=rendered)


def _body_links(*hrefs: str) -> str:
    return "\n".join(_ANCHOR.format(href=href, label=href) for href in hrefs)


def _page(nav: str = "", *, links: tuple[str, ...] = ()) -> str:
    return _PAGE_TEMPLATE.format(nav=nav, body_links=_body_links(*links))


# ---------------------------------------------------------------------------
# Fake network layer
# ---------------------------------------------------------------------------


class FakeFetcher:
    """Fakes `Fetcher.get()`, serving canned HTML keyed by URL path.

    Paths absent from `pages` raise, simulating a fetch failure (e.g. 404 or
    network error) — `enumerate_pages` must swallow this and continue.
    """

    def __init__(self, pages: dict[str, str]) -> None:
        self._pages = pages

    async def get(self, url: str) -> FetchResult:
        path = urlparse(url).path or "/"
        if path not in self._pages:
            raise RuntimeError(f"fake fetch failed for {path}")
        return FetchResult(
            url=url,
            status=200,
            body=self._pages[path].encode("utf-8"),
            content_type="text/html; charset=utf-8",
        )


def _config(**overrides: object) -> ScraperConfig:
    return ScraperConfig(origin=_ORIGIN, **overrides)  # type: ignore[arg-type]


def _page_of(canonical_path: str) -> DiscoveredPage:
    """A `DiscoveredPage` whose source matches its canonical path exactly."""
    return DiscoveredPage(canonical_path=canonical_path, source_path=canonical_path)


# ---------------------------------------------------------------------------
# 1. Golden path: nav item + L2 child, both reachable via BFS too.
# ---------------------------------------------------------------------------


class TestGoldenPath:
    @pytest.mark.asyncio
    async def test_nav_top_level_and_child_are_required_and_discovered(self) -> None:
        homepage = _page(
            nav=_nav_html(
                ("Calendario", "/calendario", ()),
                ("Juegos de Rol", "/juegos-de-rol", (("Oneshots", "/juegos-de-rol/oneshots"),)),
            ),
            links=("/calendario", "/juegos-de-rol", "/juegos-de-rol/oneshots"),
        )
        pages = {
            "/": homepage,
            "/calendario": _page(),
            "/juegos-de-rol": _page(links=("/juegos-de-rol/oneshots",)),
            "/juegos-de-rol/oneshots": _page(),
        }
        result = await enumerate_pages(FakeFetcher(pages), _config())

        assert result.pages == (
            _page_of("/"),
            _page_of("/calendario"),
            _page_of("/juegos-de-rol"),
            _page_of("/juegos-de-rol/oneshots"),
        )
        assert result.missing_required == ()
        assert result.unexpected_paths == ()


# ---------------------------------------------------------------------------
# 2. Rename regression: nav points to a brand-new path with no stale fallback.
# ---------------------------------------------------------------------------


class TestRenameRegression:
    @pytest.mark.asyncio
    async def test_renamed_nav_path_is_required_and_reachable_without_stale_fallback(
        self,
    ) -> None:
        homepage = _page(
            nav=_nav_html(("Oneshots", "/new-section", ())),
            links=("/new-section",),
        )
        pages = {
            "/": homepage,
            "/new-section": _page(),
        }
        result = await enumerate_pages(FakeFetcher(pages), _config())

        assert result.pages == (_page_of("/"), _page_of("/new-section"))
        assert result.missing_required == ()
        assert result.unexpected_paths == ()


# ---------------------------------------------------------------------------
# 3. No nav container / homepage fetch failure: required collapses to {"/"}.
# ---------------------------------------------------------------------------


class TestNoNavFallback:
    @pytest.mark.asyncio
    async def test_homepage_without_nav_container_requires_only_root(self) -> None:
        pages = {"/": _page()}
        result = await enumerate_pages(FakeFetcher(pages), _config())

        assert result.pages == (_page_of("/"),)
        assert result.missing_required == ()
        assert result.unexpected_paths == ()

    @pytest.mark.asyncio
    async def test_homepage_fetch_failure_requires_only_root(self) -> None:
        result = await enumerate_pages(FakeFetcher({}), _config())

        assert result.pages == (_page_of("/"),)
        assert result.missing_required == ()
        assert result.unexpected_paths == ()


# ---------------------------------------------------------------------------
# 4. Genuine anomalies: SKIP_PATHS exclusion and unexpected (non-nav) pages.
# ---------------------------------------------------------------------------


class TestGenuineAnomalies:
    @pytest.mark.asyncio
    async def test_skip_path_in_nav_is_excluded_from_required_and_never_discovered(
        self,
    ) -> None:
        skip_path = next(iter(SKIP_PATHS))
        homepage = _page(
            nav=_nav_html(
                ("Calendario", "/calendario", ()),
                ("Skipped", skip_path, ()),
            ),
            links=("/calendario", skip_path),
        )
        pages = {
            "/": homepage,
            "/calendario": _page(),
            skip_path: _page(),
        }
        result = await enumerate_pages(FakeFetcher(pages), _config())

        assert result.pages == (_page_of("/"), _page_of("/calendario"))
        assert result.missing_required == ()
        assert result.unexpected_paths == ()

    @pytest.mark.asyncio
    async def test_page_not_linked_from_nav_is_reported_as_unexpected(self) -> None:
        homepage = _page(
            nav=_nav_html(("Calendario", "/calendario", ())),
            links=("/calendario", "/rogue"),
        )
        pages = {
            "/": homepage,
            "/calendario": _page(),
            "/rogue": _page(),
        }
        result = await enumerate_pages(FakeFetcher(pages), _config())

        assert result.pages == (_page_of("/"), _page_of("/calendario"), _page_of("/rogue"))
        assert result.missing_required == ()
        assert result.unexpected_paths == ("/rogue",)
