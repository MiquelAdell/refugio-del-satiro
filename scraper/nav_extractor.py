"""Extract top-level nav items (and their L2 submenu children) from a
scraped BeautifulSoup document.

Pure transform — no I/O. Input is a BeautifulSoup document that has already
been stripped and href-rewritten by the orchestrator. Output is a tuple of
NavItem instances in source order, with skip rules applied.

DOM rationale: the live Google Sites header renders the primary desktop nav
as `<nav id="yuynLe"> > <ul> > <li> > <div> > <a>`. Each top-level `<li>` is
a direct child of the first `<ul>` inside the nav and contains the top-level
anchor as its first descendant `<a>`. Any later anchors inside the same
`<li>` are L2 submenu items — we preserve them as `children` on the parent
so the React shell can render them as a dropdown. The mobile overflow
`<nav id="WDxLfe">` catch-all is ignored.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from bs4 import BeautifulSoup
from bs4.element import Tag


@dataclass(frozen=True)
class NavItem:
    label: str
    href: str
    children: tuple[NavItem, ...] = field(default_factory=tuple)


_PRIMARY_NAV_ID = "yuynLe"

# Absolute-URL prefixes that the extractor must reject.
_ABSOLUTE_PREFIXES = ("http://", "https://", "//")


def _should_skip(href: str) -> bool:
    """Return True for items that the shell owns or that are not navigable."""
    if not href or href.startswith("#"):
        return True
    if any(href.startswith(p) for p in _ABSOLUTE_PREFIXES):
        return True
    # Exclude SPA-owned paths: /prestamos and /ludoteca (exact or with sub-path),
    # but NOT /prestamos-* or /ludoteca-* (different pages with that prefix).
    return (
        href == "/prestamos"
        or href.startswith("/prestamos/")
        or href == "/ludoteca"
        or href.startswith("/ludoteca/")
    )


def _anchor_pair(anchor: Tag) -> tuple[str, str] | None:
    href_raw = anchor.get("href")
    if not isinstance(href_raw, str):
        return None
    return (anchor.get_text(strip=True), href_raw.strip())


def _li_anchors(li: Tag) -> tuple[tuple[str, str], ...]:
    """All `(label, href)` anchors inside *li*, in source order."""
    pairs = (_anchor_pair(a) for a in li.find_all("a") if isinstance(a, Tag))
    return tuple(pair for pair in pairs if pair is not None)


def _top_level_li_items(
    doc: BeautifulSoup,
) -> tuple[tuple[tuple[str, str], tuple[tuple[str, str], ...]], ...]:
    """For each top-level `<li>`, return its head anchor and its child anchors.

    Returns a tuple of ((parent_label, parent_href), ((child_label, child_href), ...)).
    The first anchor inside the `<li>` is the parent; any later anchors are
    treated as L2 children.
    """
    nav = doc.find("nav", id=_PRIMARY_NAV_ID)
    if not isinstance(nav, Tag):
        return ()
    top_ul = nav.find("ul", recursive=False)
    if not isinstance(top_ul, Tag):
        return ()
    result: list[tuple[tuple[str, str], tuple[tuple[str, str], ...]]] = []
    for li in top_ul.find_all("li", recursive=False):
        if not isinstance(li, Tag):
            continue
        anchors = _li_anchors(li)
        if not anchors:
            continue
        head, *rest = anchors
        result.append((head, tuple(rest)))
    return tuple(result)


def _dedupe_pairs(pairs: tuple[tuple[str, str], ...]) -> tuple[tuple[str, str], ...]:
    """Deduplicate (label, href) pairs preserving first-seen order."""
    seen: set[tuple[str, str]] = set()
    return tuple(
        pair for pair in pairs if not (pair in seen or seen.add(pair))  # type: ignore[func-returns-value]
    )


def extract_nav(doc: BeautifulSoup) -> tuple[NavItem, ...]:
    """Return the top-level nav items from *doc*, with skip rules applied.

    Each item carries its L2 children (anchors beyond the first inside the
    same top-level `<li>`). Children are filtered by the same skip rules and
    deduplicated by `(label, href)`. Items whose own href is skipped are
    dropped entirely (their children go with them). Top-level items are
    deduplicated by `(label, href)` keeping first occurrence and preserving
    source order. Returns an empty tuple if the nav container is absent or
    yields no valid items — never raises.
    """
    try:
        raw = _top_level_li_items(doc)
    except Exception:
        return ()

    kept_pairs: list[tuple[tuple[str, str], tuple[tuple[str, str], ...]]] = []
    for head, rest in raw:
        if _should_skip(head[1]):
            continue
        kept_children = _dedupe_pairs(
            tuple(child for child in rest if not _should_skip(child[1]))
        )
        kept_pairs.append((head, kept_children))

    # Deduplicate top-level by (label, href). On first-seen we keep the
    # children encountered with that occurrence.
    seen: set[tuple[str, str]] = set()
    items: list[NavItem] = []
    for (label, href), children in kept_pairs:
        if (label, href) in seen:
            continue
        seen.add((label, href))
        items.append(
            NavItem(
                label=label,
                href=href,
                children=tuple(
                    NavItem(label=c_label, href=c_href) for c_label, c_href in children
                ),
            )
        )
    return tuple(items)
