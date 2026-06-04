"""Remove Sites chrome from a page while preserving layout and styles.

We keep the full `<html>` document — head (styles, font links, OG meta) and
body (header nav, content, user footer) — and only strip:

- Sites' JS-hook tags (`<script>`, `<noscript>`) which carry per-request nonces
  and are useless without JS anyway.
- The "Site actions" / "Report abuse" trailer that Sites appends after the
  user footer.
- Bridge iframes for Google auth and embed loaders.
- Defensive safety-net selectors for cookie banners and Report-abuse widgets
  if Sites re-arranges its DOM.

Anything outside this exclusion list stays — including the Google Fonts
stylesheets and Sites' inline layout CSS, which is what gives the scraped
page its visual parity with the live site.
"""

from __future__ import annotations

from dataclasses import dataclass

from bs4 import BeautifulSoup
from bs4.element import Tag

from scraper.config import SANITY_CONTENT_SELECTOR, STRIP_SELECTORS


@dataclass(frozen=True)
class StripResult:
    title: str
    document: BeautifulSoup
    image_urls: tuple[str, ...]


class ContentExtractionError(RuntimeError):
    """Raised when the sanity content region is missing after stripping."""


def parse_title(soup: BeautifulSoup) -> str:
    title_tag = soup.find("title")
    if title_tag and title_tag.text:
        raw = title_tag.text.strip()
        for separator in (" - ", " — ", " | "):
            if separator in raw:
                return raw.split(separator, 1)[1].strip()
        return raw
    return ""


def _collect_image_urls(soup: BeautifulSoup) -> tuple[str, ...]:
    urls: list[str] = []

    # <img src>, <img srcset>
    for img in soup.find_all("img"):
        if not isinstance(img, Tag):
            continue
        src = img.get("src")
        if isinstance(src, str) and src:
            urls.append(src)
        srcset = img.get("srcset")
        if isinstance(srcset, str):
            for entry in srcset.split(","):
                url = entry.strip().split(" ", 1)[0]
                if url:
                    urls.append(url)

    # Inline background-image: url(...)
    for node in soup.find_all(style=True):
        if not isinstance(node, Tag):
            continue
        style = node.get("style", "")
        if isinstance(style, str) and "url(" in style:
            for chunk in style.split("url(")[1:]:
                candidate = chunk.split(")", 1)[0].strip().strip("'\"")
                if candidate.startswith("http"):
                    urls.append(candidate)

    # Link rel="icon" / "apple-touch-icon" and OG image meta tags.
    for link in soup.find_all("link", rel=True):
        if not isinstance(link, Tag):
            continue
        rels = link.get("rel")
        if isinstance(rels, list):
            rel_value = " ".join(rels).lower()
        else:
            rel_value = str(rels).lower()
        if "icon" in rel_value:
            href = link.get("href")
            if isinstance(href, str) and href.startswith("http"):
                urls.append(href)

    for meta in soup.find_all("meta"):
        if not isinstance(meta, Tag):
            continue
        prop = (meta.get("property") or meta.get("itemprop") or "").lower()
        if "image" in prop or "thumbnail" in prop:
            content = meta.get("content")
            if isinstance(content, str) and content.startswith("http"):
                urls.append(content)

    # Dedupe while preserving order.
    seen: set[str] = set()
    ordered: list[str] = []
    for url in urls:
        if url not in seen:
            seen.add(url)
            ordered.append(url)
    return tuple(ordered)


def strip(html: str) -> StripResult:
    """Parse a Sites page, strip chrome, and return the mutated document."""
    soup = BeautifulSoup(html, "lxml")
    title = parse_title(soup)

    # Sanity: the content shell must exist before we touch anything else.
    if soup.select_one(SANITY_CONTENT_SELECTOR) is None:
        raise ContentExtractionError(
            f"missing sanity selector {SANITY_CONTENT_SELECTOR!r}"
        )

    for selector in STRIP_SELECTORS:
        for node in soup.select(selector):
            node.decompose()

    # A `<base>` tag would break our relative-link rewrites. Sites doesn't
    # emit one today, but be explicit.
    for base in soup.find_all("base"):
        base.decompose()

    image_urls = _collect_image_urls(soup)

    return StripResult(title=title, document=soup, image_urls=image_urls)
