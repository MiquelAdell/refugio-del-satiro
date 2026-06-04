"""Progress events emitted during a scrape.

Used by both the CLI (printed as human-readable lines) and the admin SSE
endpoint (serialized as JSON). Kept as a frozen dataclass so consumers can
pattern-match on the `kind` field.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Literal

EventKind = Literal[
    "run-started",
    "urls-enumerated",
    "page-fetched",
    "page-skipped",
    "page-stripped",
    "page-written",
    "asset-downloaded",
    "asset-reused",
    "warning",
    "error",
    "run-finished",
]


@dataclass(frozen=True)
class ScraperEvent:
    kind: EventKind
    message: str
    data: dict[str, Any] = field(default_factory=dict)

    def as_json(self) -> dict[str, Any]:
        return asdict(self)
