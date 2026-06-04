"""Manifest file tracking per-page content hashes for diff detection."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path


@dataclass(frozen=True)
class PageRecord:
    url: str
    path: str  # canonical /calendario
    output_file: str  # calendario/index.html
    title: str
    content_sha256: str
    asset_filenames: tuple[str, ...]
    scraped_at: str  # ISO-8601 UTC
    nav_sha256: str | None = None  # SHA-256 of _nav.json bytes; root page only


@dataclass(frozen=True)
class Manifest:
    generated_at: str
    pages: tuple[PageRecord, ...] = field(default_factory=tuple)

    def by_path(self) -> dict[str, PageRecord]:
        return {page.path: page for page in self.pages}


def load(path: Path) -> Manifest | None:
    if not path.is_file():
        return None
    raw = json.loads(path.read_text(encoding="utf-8"))
    pages = tuple(
        PageRecord(
            url=item["url"],
            path=item["path"],
            output_file=item["output_file"],
            title=item["title"],
            content_sha256=item["content_sha256"],
            asset_filenames=tuple(item["asset_filenames"]),
            scraped_at=item["scraped_at"],
            nav_sha256=item.get("nav_sha256"),
        )
        for item in raw.get("pages", [])
    )
    return Manifest(generated_at=raw["generated_at"], pages=pages)


def dump(manifest: Manifest, path: Path) -> None:
    payload = {
        "generated_at": manifest.generated_at,
        "pages": [
            {
                **asdict(page),
                "asset_filenames": list(page.asset_filenames),
            }
            for page in manifest.pages
        ],
    }
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
