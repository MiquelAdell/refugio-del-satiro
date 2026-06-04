"""Tie the scraper pieces together: enumerate → fetch → strip → rewrite → write."""

from __future__ import annotations

from collections.abc import AsyncIterator, Awaitable, Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

from bs4 import BeautifulSoup
from bs4.element import Tag

from scraper.asset_fetcher import fetch_asset, should_rehost
from scraper.config import ScraperConfig
from scraper.enumerator import enumerate_pages
from scraper.events import ScraperEvent
from scraper.fetcher import Fetcher
from scraper.linker import (
    INTERNAL_HOSTS,
    is_internal_href,
    path_to_output,
    rewrite_href,
)
from scraper.manifest import Manifest, PageRecord
from scraper.nav_extractor import extract_nav
from scraper.shell_injector import inject_site_shell
from scraper.stripper import ContentExtractionError, strip
from scraper.writer import (
    DeletionGuardError,
    content_sha,
    purge_orphan_assets,
    purge_stale_files,
    read_previous_manifest,
    write_manifest,
    write_nav,
    write_page,
)

EventSink = Callable[[ScraperEvent], Awaitable[None] | None]


@dataclass(frozen=True)
class RunSummary:
    pages_written: int
    pages_unchanged: int
    pages_deleted: int
    assets_downloaded: int
    assets_reused: int
    warnings: int
    errors: int


async def _emit(sink: EventSink | None, event: ScraperEvent) -> None:
    if sink is None:
        return
    result = sink(event)
    if hasattr(result, "__await__"):
        await result  # type: ignore[misc]


async def _rehost_and_rewrite(
    *,
    fetcher: Fetcher,
    soup: BeautifulSoup,
    image_urls: tuple[str, ...],
    assets_dir: Path,
    sink: EventSink | None,
    dry_run: bool,
) -> tuple[tuple[str, ...], int, int]:
    rehost_map: dict[str, str] = {}
    downloaded = 0
    reused = 0

    for url in image_urls:
        if not should_rehost(url):
            continue
        if url in rehost_map:
            continue
        if dry_run:
            import hashlib

            rehost_map[url] = (
                f"/_assets/{hashlib.sha1(url.encode('utf-8')).hexdigest()[:16]}.???"
            )
            continue
        try:
            filename, was_downloaded = await fetch_asset(
                fetcher, url, assets_dir=assets_dir
            )
        except Exception as exc:
            await _emit(
                sink,
                ScraperEvent(
                    kind="warning",
                    message=f"asset download failed: {url}",
                    data={"error": str(exc)},
                ),
            )
            continue
        rehost_map[url] = f"/_assets/{filename}"
        if was_downloaded:
            downloaded += 1
            await _emit(
                sink,
                ScraperEvent(
                    kind="asset-downloaded",
                    message=f"downloaded {filename}",
                    data={"url": url, "filename": filename},
                ),
            )
        else:
            reused += 1
            await _emit(
                sink,
                ScraperEvent(
                    kind="asset-reused",
                    message=f"reused {filename}",
                    data={"url": url, "filename": filename},
                ),
            )

    # <img src> + srcset
    for img in soup.find_all("img"):
        if not isinstance(img, Tag):
            continue
        src = img.get("src")
        if isinstance(src, str) and src in rehost_map:
            img["src"] = rehost_map[src]
        srcset = img.get("srcset")
        if isinstance(srcset, str):
            new_entries: list[str] = []
            for entry in srcset.split(","):
                parts = entry.strip().split(" ", 1)
                url = parts[0]
                descriptor = f" {parts[1]}" if len(parts) > 1 else ""
                new_entries.append(f"{rehost_map.get(url, url)}{descriptor}")
            img["srcset"] = ", ".join(new_entries)

    # inline background-image: url(...) and other style url() refs
    for node in soup.find_all(style=True):
        if not isinstance(node, Tag):
            continue
        style = node.get("style", "")
        if isinstance(style, str) and "url(" in style:
            new_style = style
            for remote, local in rehost_map.items():
                new_style = new_style.replace(remote, local)
            node["style"] = new_style

    # <link rel="icon|apple-touch-icon" href="...googleusercontent…"> — rehost.
    for link in soup.find_all("link", rel=True):
        if not isinstance(link, Tag):
            continue
        rels = link.get("rel")
        rel_value = (" ".join(rels) if isinstance(rels, list) else str(rels)).lower()
        if "icon" not in rel_value:
            continue
        href = link.get("href")
        if isinstance(href, str) and href in rehost_map:
            link["href"] = rehost_map[href]

    # <meta property="og:image" content="…"> — rehost.
    for meta in soup.find_all("meta"):
        if not isinstance(meta, Tag):
            continue
        content = meta.get("content")
        if isinstance(content, str) and content in rehost_map:
            meta["content"] = rehost_map[content]

    # <a href> — rewrite internal links, harden external.
    for anchor in soup.find_all("a"):
        if not isinstance(anchor, Tag):
            continue
        href = anchor.get("href")
        if not isinstance(href, str):
            continue
        if is_internal_href(href):
            anchor["href"] = rewrite_href(href)
        else:
            if href.startswith(("mailto:", "tel:")):
                continue
            if any(host in href for host in INTERNAL_HOSTS):
                continue
            anchor["target"] = "_blank"
            existing_rel = anchor.get("rel", [])
            if isinstance(existing_rel, str):
                existing_rel = existing_rel.split()
            rel = set(existing_rel) | {"noopener", "noreferrer"}
            anchor["rel"] = " ".join(sorted(rel))

    assets_used = tuple(sorted({Path(path).name for path in rehost_map.values()}))
    return assets_used, downloaded, reused


def _render_document(soup: BeautifulSoup) -> str:
    """Serialize the mutated document, keeping the DOCTYPE."""
    output = soup.decode(formatter="html5")
    if not output.lstrip().lower().startswith("<!doctype"):
        output = "<!doctype html>\n" + output
    return output


async def run(
    config: ScraperConfig,
    *,
    sink: EventSink | None = None,
    dry_run: bool = False,
    force_delete: bool = False,
) -> RunSummary:
    output_dir = config.output_dir
    assets_dir = output_dir / config.assets_subdir

    async with Fetcher(
        user_agent=config.user_agent,
        timeout_s=config.request_timeout_s,
        max_retries=config.max_retries,
    ) as fetcher:
        await _emit(
            sink,
            ScraperEvent(
                kind="run-started",
                message="enumerating pages",
                data={"origin": config.origin, "dry_run": dry_run},
            ),
        )

        enumeration = await enumerate_pages(fetcher, config)
        await _emit(
            sink,
            ScraperEvent(
                kind="urls-enumerated",
                message=f"found {len(enumeration.pages)} paths",
                data={
                    "paths": [page.canonical_path for page in enumeration.pages],
                    "missing_required": list(enumeration.missing_required),
                    "unexpected_paths": list(enumeration.unexpected_paths),
                },
            ),
        )

        for unexpected in enumeration.unexpected_paths:
            await _emit(
                sink,
                ScraperEvent(
                    kind="warning",
                    message=f"unknown path outside routing table: {unexpected}",
                    data={"path": unexpected},
                ),
            )

        if not dry_run:
            output_dir.mkdir(parents=True, exist_ok=True)
            assets_dir.mkdir(parents=True, exist_ok=True)

        new_pages: list[PageRecord] = []
        previous_manifest = (
            read_previous_manifest(output_dir, config.manifest_file)
            if not dry_run
            else None
        )
        previous_by_path = (
            previous_manifest.by_path() if previous_manifest is not None else {}
        )

        pages_written = 0
        pages_unchanged = 0
        total_downloaded = 0
        total_reused = 0
        warnings = 0
        errors = 0

        for page_info in enumeration.pages:
            canonical = page_info.canonical_path
            source = page_info.source_path
            url = f"{config.origin}{source}" if source != "/" else f"{config.origin}/"
            try:
                fetched = await fetcher.get(url)
            except Exception as exc:
                errors += 1
                await _emit(
                    sink,
                    ScraperEvent(
                        kind="error",
                        message=f"fetch failed: {url}",
                        data={"path": canonical, "error": str(exc)},
                    ),
                )
                continue

            html = fetched.body.decode("utf-8", errors="replace")
            await _emit(
                sink,
                ScraperEvent(
                    kind="page-fetched",
                    message=f"fetched {canonical}",
                    data={"path": canonical, "bytes": len(fetched.body)},
                ),
            )

            try:
                stripped = strip(html)
            except ContentExtractionError as exc:
                errors += 1
                await _emit(
                    sink,
                    ScraperEvent(
                        kind="error",
                        message=f"strip failed: {url}",
                        data={"path": canonical, "error": str(exc)},
                    ),
                )
                continue

            await _emit(
                sink,
                ScraperEvent(
                    kind="page-stripped",
                    message=f"stripped {canonical} ({stripped.title!r})",
                    data={"path": canonical, "title": stripped.title},
                ),
            )

            asset_filenames, downloaded, reused = await _rehost_and_rewrite(
                fetcher=fetcher,
                soup=stripped.document,
                image_urls=stripped.image_urls,
                assets_dir=assets_dir,
                sink=sink,
                dry_run=dry_run,
            )
            total_downloaded += downloaded
            total_reused += reused

            inject_site_shell(stripped.document)

            document_html = _render_document(stripped.document)
            output_file = path_to_output(canonical, config.assets_subdir)
            sha = content_sha(document_html)
            previous = previous_by_path.get(canonical)

            nav_sha: str | None = None
            if canonical == "/" and not dry_run:
                nav_items = extract_nav(stripped.document)
                nav_sha = write_nav(nav_items, output_dir)
                if nav_sha is None:
                    await _emit(
                        sink,
                        ScraperEvent(
                            kind="warning",
                            message=(
                                "nav extraction yielded no items;"
                                " _nav.json not written"
                            ),
                            data={"path": canonical},
                        ),
                    )

            record = PageRecord(
                url=url,
                path=canonical,
                output_file=output_file,
                title=stripped.title,
                content_sha256=sha,
                asset_filenames=asset_filenames,
                scraped_at=datetime.now(UTC).isoformat(timespec="seconds"),
                nav_sha256=nav_sha,
            )
            new_pages.append(record)

            if previous is not None and previous.content_sha256 == sha and not dry_run:
                pages_unchanged += 1
                continue

            if dry_run:
                pages_written += 1
                await _emit(
                    sink,
                    ScraperEvent(
                        kind="page-written",
                        message=f"[dry-run] would write {output_file}",
                        data={"path": canonical, "output_file": output_file},
                    ),
                )
            else:
                write_page(
                    output_dir=output_dir,
                    output_file=output_file,
                    document_html=document_html,
                )
                pages_written += 1
                await _emit(
                    sink,
                    ScraperEvent(
                        kind="page-written",
                        message=f"wrote {output_file}",
                        data={"path": canonical, "output_file": output_file},
                    ),
                )

        deleted_files: list[str] = []
        if not dry_run:
            manifest = Manifest(
                generated_at=datetime.now(UTC).isoformat(timespec="seconds"),
                pages=tuple(new_pages),
            )
            try:
                if force_delete:
                    effective_config = ScraperConfig(
                        **{
                            **config.__dict__,
                            "max_page_deletion_ratio": 1.0,
                        }
                    )
                else:
                    effective_config = config
                deleted_files, _ = purge_stale_files(
                    output_dir=output_dir,
                    new_pages=tuple(new_pages),
                    previous_manifest=previous_manifest,
                    config=effective_config,
                )
            except DeletionGuardError as exc:
                errors += 1
                await _emit(
                    sink,
                    ScraperEvent(
                        kind="error",
                        message=str(exc),
                        data={"kind": "deletion-guard"},
                    ),
                )
            write_manifest(output_dir, manifest, config.manifest_file)
            purged = purge_orphan_assets(
                output_dir=output_dir,
                assets_subdir=config.assets_subdir,
                manifest=manifest,
            )
            for name in purged:
                await _emit(
                    sink,
                    ScraperEvent(
                        kind="warning",
                        message=f"removed orphan asset {name}",
                        data={"kind": "orphan-asset", "filename": name},
                    ),
                )

        summary = RunSummary(
            pages_written=pages_written,
            pages_unchanged=pages_unchanged,
            pages_deleted=len(deleted_files),
            assets_downloaded=total_downloaded,
            assets_reused=total_reused,
            warnings=warnings,
            errors=errors,
        )
        await _emit(
            sink,
            ScraperEvent(
                kind="run-finished",
                message=(
                    f"{summary.pages_written} written, "
                    f"{summary.pages_unchanged} unchanged, "
                    f"{summary.pages_deleted} deleted, "
                    f"{summary.assets_downloaded} assets, "
                    f"{summary.errors} errors"
                ),
                data=summary.__dict__,
            ),
        )
        return summary


async def stream_events(
    config: ScraperConfig,
) -> AsyncIterator[ScraperEvent]:
    """Async generator wrapping `run()` for SSE producers."""
    queue: list[ScraperEvent] = []

    async def sink(event: ScraperEvent) -> None:
        queue.append(event)

    import asyncio

    task = asyncio.create_task(run(config, sink=sink))
    while not task.done() or queue:
        if queue:
            yield queue.pop(0)
        else:
            await asyncio.sleep(0.05)
    await task
