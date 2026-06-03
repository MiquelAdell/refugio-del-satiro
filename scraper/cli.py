"""Command-line entrypoint: `python -m scraper` and `refugio content sync`."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path
from typing import Annotated

import typer

from scraper.config import ScraperConfig, default_config
from scraper.events import ScraperEvent
from scraper.orchestrator import run
from scraper.shell_injector import inject_site_shell

app = typer.Typer(
    name="scraper",
    help="Scrape www.refugiodelsatiro.es into frontend/public/content-mirror/.",
    add_completion=False,
    no_args_is_help=False,
)


def _print_event(event: ScraperEvent) -> None:
    typer.echo(f"[{event.kind}] {event.message}")


def _build_config(output: Path | None) -> ScraperConfig:
    base = default_config()
    if output is None:
        return base
    return ScraperConfig(
        origin=base.origin,
        output_dir=output,
        assets_subdir=base.assets_subdir,
        manifest_file=base.manifest_file,
        user_agent=base.user_agent,
        request_timeout_s=base.request_timeout_s,
        max_retries=base.max_retries,
        concurrent_requests=base.concurrent_requests,
        max_crawl_depth=base.max_crawl_depth,
        max_page_deletion_ratio=base.max_page_deletion_ratio,
    )


@app.command("run")
def run_cmd(
    output: Annotated[
        Path | None,
        typer.Option(
            "--output",
            "-o",
            help="Override output directory (default: frontend/public/content-mirror).",
        ),
    ] = None,
    dry_run: Annotated[
        bool,
        typer.Option(
            "--dry-run", help="Don't write anything, just report planned work."
        ),
    ] = False,
    force_delete: Annotated[
        bool,
        typer.Option(
            "--force-delete",
            help="Bypass the deletion-ratio safety guard. Use if Sites restructured.",
        ),
    ] = False,
) -> None:
    """Run a full scrape end-to-end."""
    config = _build_config(output)
    summary = asyncio.run(
        run(config, sink=_print_event, dry_run=dry_run, force_delete=force_delete)
    )
    if summary.errors > 0:
        typer.echo(f"Completed with {summary.errors} error(s)", err=True)
        sys.exit(2)


@app.command("list-urls")
def list_urls_cmd() -> None:
    """Enumerate URLs without fetching page content."""
    from scraper.enumerator import enumerate_pages
    from scraper.fetcher import Fetcher

    config = default_config()

    async def _list() -> None:
        async with Fetcher(
            user_agent=config.user_agent,
            timeout_s=config.request_timeout_s,
            max_retries=config.max_retries,
        ) as fetcher:
            result = await enumerate_pages(fetcher, config)
            for page in result.pages:
                if page.source_path == page.canonical_path:
                    typer.echo(page.canonical_path)
                else:
                    typer.echo(f"{page.canonical_path}\t(source: {page.source_path})")
            if result.missing_required:
                typer.echo(
                    "missing-required: " + ", ".join(result.missing_required),
                    err=True,
                )
            if result.unexpected_paths:
                typer.echo(
                    "unexpected: " + ", ".join(result.unexpected_paths),
                    err=True,
                )

    asyncio.run(_list())


@app.command("inject-shell")
def inject_shell_cmd(
    output: Annotated[
        Path | None,
        typer.Option(
            "--output",
            "-o",
            help="Override content-mirror directory (default: frontend/public/content-mirror).",
        ),
    ] = None,
) -> None:
    """Retrofit existing content-mirror HTML files with the site-shell embed scaffolding.

    Reads every *.html under the content-mirror directory, applies
    inject_site_shell(), and writes the result back in-place.  Safe to run
    multiple times — the injection is idempotent.
    """
    from bs4 import BeautifulSoup

    config = _build_config(output)
    content_dir = config.output_dir

    html_files = list(content_dir.rglob("*.html"))
    if not html_files:
        typer.echo(f"No HTML files found under {content_dir}", err=True)
        raise typer.Exit(1)

    modified = 0
    for path in html_files:
        original = path.read_text(encoding="utf-8")
        soup = BeautifulSoup(original, "html.parser")
        inject_site_shell(soup)
        updated = soup.decode(formatter="html5")
        if not updated.lstrip().lower().startswith("<!doctype"):
            updated = "<!doctype html>\n" + updated
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            modified += 1
            typer.echo(f"  updated {path.relative_to(content_dir)}")

    typer.echo(f"Done — {modified}/{len(html_files)} files updated.")


def _invoke_from_module() -> None:
    """Entry used by `python -m scraper` — default to `run`."""
    if len(sys.argv) == 1:
        sys.argv.append("run")
    app()


if __name__ == "__main__":
    _invoke_from_module()
