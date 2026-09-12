"""Search-engine metadata for mirrored pages."""

from __future__ import annotations

from bs4 import BeautifulSoup
from bs4.element import Tag


def canonical_url(canonical_origin: str, path: str) -> str:
    """Return the public URL for a canonical mirror path."""
    origin = canonical_origin.rstrip("/")
    if path == "/":
        return f"{origin}/"
    return f"{origin}/{path.strip('/')}/"


def inject_canonical_metadata(
    soup: BeautifulSoup, *, canonical_origin: str, path: str
) -> None:
    """Replace upstream canonical metadata with the configured public URL."""
    head = soup.head
    if not isinstance(head, Tag):
        head = soup.new_tag("head")
        if soup.html is not None:
            soup.html.insert(0, head)
        else:
            soup.insert(0, head)

    for link in head.find_all("link", rel=True):
        rel = link.get("rel", [])
        rel_values = rel if isinstance(rel, list) else str(rel).split()
        if "canonical" in {value.lower() for value in rel_values}:
            link.decompose()

    canonical = soup.new_tag("link", rel="canonical")
    canonical["href"] = canonical_url(canonical_origin, path)
    head.append(canonical)
