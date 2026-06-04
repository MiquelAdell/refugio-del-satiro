"""BFS crawl of the mirrored site to discover all pages to scrape."""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from urllib.parse import unquote, urlparse

from bs4 import BeautifulSoup
from bs4.element import Tag

from scraper.config import REQUIRED_PATHS, SKIP_PATHS, ScraperConfig
from scraper.fetcher import Fetcher
from scraper.linker import canonicalize_path, is_internal_href


@dataclass(frozen=True)
class DiscoveredPage:
    """A page discovered during enumeration.

    `source_path` is the path exactly as the site serves it (possibly containing
    accents). `canonical_path` is the deaccented, lowercased form we emit.
    """

    canonical_path: str
    source_path: str


@dataclass(frozen=True)
class EnumerationResult:
    pages: tuple[DiscoveredPage, ...]
    missing_required: tuple[str, ...]
    unexpected_paths: tuple[str, ...]


def _extract_links(html: str) -> tuple[str, ...]:
    soup = BeautifulSoup(html, "lxml")
    hrefs: list[str] = []
    for a in soup.find_all("a", href=True):
        if not isinstance(a, Tag):
            continue
        href = a.get("href")
        if isinstance(href, str):
            hrefs.append(href)
    return tuple(hrefs)


def _source_path_of(href: str) -> str:
    """Return the server-side path portion of an href, URL-decoded."""
    parsed = urlparse(href)
    return unquote(parsed.path or "/")


async def enumerate_pages(
    fetcher: Fetcher,
    config: ScraperConfig,
) -> EnumerationResult:
    # canonical → source_path. First-seen source wins so we don't flap.
    discovered: dict[str, str] = {}
    queue: deque[tuple[str, str, int]] = deque()
    queue.append(("/", "/", 0))

    while queue:
        canonical, source_path, depth = queue.popleft()
        if canonical in discovered:
            continue
        if canonical in SKIP_PATHS or canonical.lower() in SKIP_PATHS:
            continue
        discovered[canonical] = source_path
        if depth >= config.max_crawl_depth:
            continue

        url = (
            f"{config.origin}{source_path}"
            if source_path != "/"
            else f"{config.origin}/"
        )
        try:
            result = await fetcher.get(url)
        except Exception:
            continue

        html = result.body.decode("utf-8", errors="replace")
        for href in _extract_links(html):
            if not is_internal_href(href):
                continue
            if href.startswith(("mailto:", "tel:", "javascript:")):
                continue
            next_canonical = canonicalize_path(href)
            next_source = _source_path_of(href)
            if next_canonical in SKIP_PATHS:
                continue
            if next_canonical not in discovered:
                queue.append((next_canonical, next_source, depth + 1))

    required = set(REQUIRED_PATHS)
    for required_path in required - discovered.keys():
        # Required pages not reached by the crawl fall back to canonical=source.
        discovered[required_path] = required_path

    pages = tuple(
        DiscoveredPage(canonical_path=canonical, source_path=source)
        for canonical, source in sorted(discovered.items())
    )
    missing_required = tuple(sorted(required - {page.canonical_path for page in pages}))
    unexpected = tuple(sorted({page.canonical_path for page in pages} - required))
    return EnumerationResult(
        pages=pages,
        missing_required=missing_required,
        unexpected_paths=unexpected,
    )
