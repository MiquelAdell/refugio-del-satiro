"""URL rewriting: internal links → relative, path normalization, accent strip.

Pure functions only — easy to unit-test in isolation.
"""

from __future__ import annotations

import unicodedata
from urllib.parse import unquote, urlparse

# Hosts that count as "this site". Covers the apex domain plus the legacy
# Google Sites hosting URL (some content pages still link to it directly).
INTERNAL_HOSTS: frozenset[str] = frozenset(
    {
        "www.refugiodelsatiro.es",
        "refugiodelsatiro.es",
        "sites.google.com",
    }
)


def is_internal_href(href: str) -> bool:
    if not href:
        return False
    if href.startswith("#"):
        return False
    parsed = urlparse(href)
    if not parsed.netloc and parsed.path:
        # Schemeless relative URL — always internal to the current site.
        return True
    if parsed.netloc in INTERNAL_HOSTS:
        if parsed.netloc == "sites.google.com":
            # Only the Sites URL for this specific property counts as internal.
            return parsed.path.startswith("/view/refugiodelsatiro")
        return True
    return False


def _deaccent_segment(segment: str) -> str:
    """Strip accents from a path segment but preserve ASCII punctuation.

    `campañas` → `campanas`, `rol-avançat` → `rol-avancat`.
    """
    normalized = unicodedata.normalize("NFKD", segment)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch))


def canonicalize_path(raw: str) -> str:
    """Normalize a site path to the form we mirror on disk.

    - Decodes percent-encoded characters so comparisons are stable.
    - Strips accents from each path segment.
    - Lowercases legacy mixed-case paths (e.g. `/Validacion-Membresia`).
    - Collapses trailing slash except for the root.
    """
    decoded = unquote(raw)
    parsed = urlparse(decoded)
    path = parsed.path or "/"
    segments = [
        _deaccent_segment(segment).lower() for segment in path.split("/") if segment
    ]
    canonical = "/" + "/".join(segments) if segments else "/"
    return canonical


def rewrite_href(href: str) -> str:
    """Rewrite an `<a href>` value for the mirrored site.

    Internal links become canonical relative paths. External links are left
    untouched so callers can decide separately whether to add `target="_blank"`.
    """
    if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
        return href
    if not is_internal_href(href):
        return href
    parsed = urlparse(href)
    canonical = canonicalize_path(parsed.path or "/")
    if parsed.netloc == "sites.google.com":
        # /view/refugiodelsatiro/foo/bar → /foo/bar
        prefix = "/view/refugiodelsatiro"
        if canonical.startswith(prefix):
            canonical = canonical[len(prefix) :] or "/"
    fragment = f"#{parsed.fragment}" if parsed.fragment else ""
    return f"{canonical}{fragment}"


def path_to_output(path: str, assets_subdir: str) -> str:
    """Map a canonical path to its on-disk file location under the mirror.

    Root becomes `index.html`, anything else becomes `<path>/index.html`.
    """
    canonical = canonicalize_path(path)
    if canonical == "/":
        return "index.html"
    trimmed = canonical.strip("/")
    if trimmed.startswith(assets_subdir + "/"):
        return trimmed  # already an asset path
    return f"{trimmed}/index.html"
