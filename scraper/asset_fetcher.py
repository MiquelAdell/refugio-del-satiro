"""Download and dedupe remote images referenced from scraped pages."""

from __future__ import annotations

import hashlib
import mimetypes
from pathlib import Path

from scraper.config import REHOSTED_IMAGE_HOST_SUBSTRINGS
from scraper.fetcher import Fetcher


def should_rehost(url: str) -> bool:
    return any(host in url for host in REHOSTED_IMAGE_HOST_SUBSTRINGS)


def _extension_from(content_type: str, url: str) -> str:
    mime = content_type.split(";", 1)[0].strip().lower()
    guessed = mimetypes.guess_extension(mime) if mime else None
    if guessed == ".jpe":
        guessed = ".jpg"
    if guessed:
        return guessed
    # Fall back to sniffing the URL path.
    suffix = Path(url.split("?", 1)[0]).suffix
    return suffix if suffix else ".bin"


async def fetch_asset(
    fetcher: Fetcher,
    url: str,
    *,
    assets_dir: Path,
) -> tuple[str, bool]:
    """Download the asset and store it under a content-addressed filename.

    Returns `(filename, was_downloaded)`. Filenames are `<content-sha1>.<ext>`
    so that Google Sites' per-request URL rotation doesn't cause the same
    image to be saved repeatedly under different names.
    """
    result = await fetcher.get(url)
    content_hash = hashlib.sha1(result.body).hexdigest()[:16]
    extension = _extension_from(result.content_type, url)
    filename = f"{content_hash}{extension}"
    target = assets_dir / filename
    if target.is_file():
        return filename, False
    assets_dir.mkdir(parents=True, exist_ok=True)
    target.write_bytes(result.body)
    return filename, True
