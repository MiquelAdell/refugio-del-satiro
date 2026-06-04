from __future__ import annotations

import re
import unicodedata
from collections.abc import Iterable

_NON_ALNUM = re.compile(r"[^a-z0-9]+")
_DASHES = re.compile(r"-+")


def slugify(value: str) -> str:
    """Convert a string into a URL-safe slug.

    Lowercases, NFKD-normalises to strip diacritics, replaces any run of
    non-alphanumeric characters with a single dash, and trims leading/
    trailing dashes. An empty result falls back to ``"juego"`` so the slug
    column never becomes an empty string.
    """
    normalised = unicodedata.normalize("NFKD", value)
    ascii_only = normalised.encode("ascii", "ignore").decode("ascii")
    lowered = ascii_only.lower()
    dashed = _NON_ALNUM.sub("-", lowered)
    collapsed = _DASHES.sub("-", dashed).strip("-")
    return collapsed or "juego"


def ensure_unique(base: str, taken: Iterable[str]) -> str:
    """Return ``base`` if not in ``taken``, otherwise ``base-2``, ``base-3``, ..."""
    taken_set = set(taken)
    if base not in taken_set:
        return base
    return next(
        candidate
        for candidate in (f"{base}-{i}" for i in range(2, 10_000))
        if candidate not in taken_set
    )
