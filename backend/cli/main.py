from __future__ import annotations

import csv
from pathlib import Path
from typing import Annotated

import typer

from backend.config import Settings
from backend.data.database import get_connection
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
from backend.data.repositories.sqlite_password_token_repository import (
    SqlitePasswordTokenRepository,
)
from backend.domain.use_cases.import_members import ImportMembersUseCase
from backend.migrations.runner import run_migrations

app = typer.Typer(name="refugio", help="Refugio del Sátiro — admin CLI")

from scraper.cli import app as _content_scraper_app  # noqa: E402

app.add_typer(_content_scraper_app, name="content", help="Content-mirror commands.")


def _get_settings() -> Settings:
    return Settings()


@app.command()
def migrate() -> None:
    """Run database migrations."""
    settings = _get_settings()
    conn = get_connection(settings.db_path)
    try:
        applied = run_migrations(conn)
        if applied:
            for version in applied:
                typer.echo(f"Applied migration: {version}")
            typer.echo(f"Done. {len(applied)} migration(s) applied.")
        else:
            typer.echo("Database is up to date.")
    finally:
        conn.close()


@app.command()
def import_games(
    json_file: Annotated[
        str | None,
        typer.Argument(help="Path to JSON seed file (alternative to BGG API)"),
    ] = None,
) -> None:
    """Import games from BGG API or a JSON seed file."""
    import json

    from backend.data.repositories.sqlite_game_repository import SqliteGameRepository
    from backend.domain.use_cases.import_games import ImportGamesUseCase

    settings = _get_settings()
    conn = get_connection(settings.db_path)
    try:
        run_migrations(conn)
        game_repo = SqliteGameRepository(conn)

        if json_file:
            # Import from JSON seed file
            path = Path(json_file)
            if not path.exists():
                typer.echo(f"Error: file not found: {json_file}", err=True)
                raise typer.Exit(code=1)

            with path.open(encoding="utf-8") as f:
                games_data = json.load(f)

            from backend.data.bgg_client import BggGame

            bgg_games = [
                BggGame(
                    bgg_id=g["bgg_id"],
                    name=g["name"],
                    thumbnail_url=g.get("thumbnail_url", ""),
                    year_published=g.get("year_published", 0),
                )
                for g in games_data
            ]

            created = 0
            updated = 0
            for g in games_data:
                existing = game_repo.get_by_bgg_id(g["bgg_id"])
                game_repo.upsert_by_bgg_id(
                    bgg_id=g["bgg_id"],
                    name=g["name"],
                    thumbnail_url=g.get("thumbnail_url", ""),
                    image_url=g.get("image_url", ""),
                    year_published=g.get("year_published", 0),
                    min_players=g.get("min_players", 0),
                    max_players=g.get("max_players", 0),
                    playing_time=g.get("playing_time", 0),
                    bgg_rating=g.get("bgg_rating", 0.0),
                    location=g.get("location", "armari"),
                )
                if existing is None:
                    created += 1
                else:
                    updated += 1

            typer.echo(
                f"Done. {created} new, {updated} updated, {len(bgg_games)} total."
            )
        else:
            # Import from BGG API (requires BGG_BEARER_TOKEN env var)
            from backend.data.bgg_client import BggClient

            if not settings.bgg_bearer_token:
                typer.echo(
                    "Tip: set BGG_BEARER_TOKEN env var for authenticated API access. "
                    "Without it, the API may be blocked and will fall back to HTML scraping.",
                    err=True,
                )

            bgg_client = BggClient(
                username="RefugioDelSatiro", bearer_token=settings.bgg_bearer_token
            )
            use_case = ImportGamesUseCase(game_repo, bgg_client)

            typer.echo("Fetching games from BGG (this may take a moment)...")
            result = use_case.execute()
            typer.echo(
                f"Done. {result.created} new, {result.updated} updated, {result.total} total."
            )
    finally:
        conn.close()


@app.command()
def enrich_games() -> None:
    """Fetch full details (images, player count, time, rating) from BGG for all games."""
    from backend.data.bgg_client import BggClient
    from backend.data.repositories.sqlite_game_repository import SqliteGameRepository

    settings = _get_settings()
    conn = get_connection(settings.db_path)
    try:
        run_migrations(conn)
        game_repo = SqliteGameRepository(conn)
        bgg_client = BggClient(
            username="RefugioDelSatiro", bearer_token=settings.bgg_bearer_token
        )

        games = game_repo.list_all()
        bgg_ids = [g.bgg_id for g in games if g.bgg_id]
        typer.echo(f"Fetching details for {len(bgg_ids)} games...")

        details = bgg_client.fetch_details(bgg_ids)
        updated = 0
        for game in games:
            if game.bgg_id in details:
                d = details[game.bgg_id]
                game_repo.upsert_by_bgg_id(
                    bgg_id=game.bgg_id,
                    name=game.name,
                    thumbnail_url=d.thumbnail_url or game.thumbnail_url,
                    image_url=d.image_url or game.image_url or game.thumbnail_url,
                    year_published=game.year_published,
                    min_players=d.min_players,
                    max_players=d.max_players,
                    playing_time=d.playing_time,
                    bgg_rating=d.bgg_rating,
                    location=game.location,
                )
                updated += 1

        typer.echo(f"Done. {updated} games enriched with full details.")
    finally:
        conn.close()


@app.command()
def import_members(
    csv_path: Annotated[
        str | None,
        typer.Argument(help="Path to CSV file to import"),
    ] = None,
    base_url: Annotated[
        str,
        typer.Option(
            "--base-url",
            help="Base URL for one-time password links",
        ),
    ] = "",
    name: Annotated[
        str | None,
        typer.Option(
            "--name", help="Full name for single member add (Nombre Apellidos)"
        ),
    ] = None,
    email: Annotated[
        str | None,
        typer.Option("--email", help="Email for single member add"),
    ] = None,
    nickname: Annotated[
        str | None,
        typer.Option("--nickname", help="Nickname for single member add"),
    ] = None,
    phone: Annotated[
        str | None,
        typer.Option("--phone", help="Phone for single member add"),
    ] = None,
    member_number: Annotated[
        int | None,
        typer.Option("--member-number", help="Member number for single member add"),
    ] = None,
    admin: Annotated[
        bool,
        typer.Option("--admin", help="Set admin flag for single member"),
    ] = False,
) -> None:
    """Import members from a CSV file or add a single member."""
    settings = _get_settings()
    resolved_base_url = base_url or settings.base_url

    conn = get_connection(settings.db_path)
    try:
        run_migrations(conn)
        member_repo = SqliteMemberRepository(conn)
        token_repo = SqlitePasswordTokenRepository(conn)
        use_case = ImportMembersUseCase(member_repo, token_repo, resolved_base_url)

        if email:
            # Single member add mode
            parts = (name or "").split(" ", 1)
            first_name = parts[0] if parts else ""
            last_name = parts[1] if len(parts) > 1 else ""

            raw_members = [
                {
                    "Nº Socio": str(member_number) if member_number is not None else "",
                    "Apellidos": last_name,
                    "Nombre": first_name,
                    "Apodo": nickname or "",
                    "Telefóno": phone or "",
                    "Email": email,
                    "admin": "yes" if admin else "",
                }
            ]
        elif csv_path:
            # CSV import mode
            path = Path(csv_path)
            if not path.exists():
                typer.echo(f"Error: file not found: {csv_path}", err=True)
                raise typer.Exit(code=1)

            with path.open(encoding="utf-8") as f:
                reader = csv.DictReader(f)
                raw_members = list(reader)
        else:
            typer.echo(
                "Error: provide a CSV path or --email for single member add.",
                err=True,
            )
            raise typer.Exit(code=1)

        results = use_case.execute(raw_members)

        for result in results:
            typer.echo(
                f"{result.member.display_name} ({result.member.email}): "
                f"{result.token_url}"
            )

        if not results:
            typer.echo("No new members added.")
        else:
            typer.echo(f"\n{len(results)} new member(s) imported.")
    finally:
        conn.close()


if __name__ == "__main__":
    app()
