"""Idempotently seed test board-game and RPG items into the dev SQLite DB.

The seeded items provide stable fixtures for the e2e catalog journeys. They
are upserted so re-runs are safe and their slugs are deterministic.

Usage:
    python -m scripts.seed_test_rpg
    # or:
    python scripts/seed_test_rpg.py

Env vars:
    REFUGIO_DB_PATH  (resolved via backend.config.Settings)
"""

from __future__ import annotations

from typing import TypedDict

from backend.config import Settings
from backend.data.database import get_connection
from backend.data.repositories.sqlite_game_repository import SqliteGameRepository
from backend.migrations.runner import run_migrations


class CatalogSeed(TypedDict):
    bgg_id: int
    name: str
    thumbnail_url: str
    image_url: str
    year_published: int
    min_players: int
    max_players: int
    playing_time: int
    bgg_rating: float
    location: str
    item_type: str
    description: str


# Stable fictional catalog entries that don't clash with real BGG IDs in use.
_BOARD_GAME_SEED: CatalogSeed = {
    "bgg_id": 999999998,
    "name": "E2E Test Board Game",
    "thumbnail_url": "",
    "image_url": "",
    "year_published": 2024,
    "min_players": 2,
    "max_players": 4,
    "playing_time": 45,
    "bgg_rating": 7.0,
    "location": "armari",
    "item_type": "boardgame",
    "description": "A board game seeded for e2e catalog tests.",
}

_RPG_SEED: CatalogSeed = {
    "bgg_id": 999999999,
    "name": "E2E Test RPG Manual",
    "thumbnail_url": "",
    "image_url": "",
    "year_published": 2024,
    "min_players": 1,
    "max_players": 6,
    "playing_time": 120,
    "bgg_rating": 7.5,
    "location": "armari",
    "item_type": "rpgitem",
    "description": "A test RPG item seeded by scripts/seed_test_rpg.py for e2e purposes.",
}

_CATALOG_SEEDS = (_BOARD_GAME_SEED, _RPG_SEED)


def main() -> None:
    settings = Settings()
    conn = get_connection(settings.db_path)
    try:
        run_migrations(conn)
        repo = SqliteGameRepository(conn)
        for seed in _CATALOG_SEEDS:
            game = repo.upsert_by_bgg_id(**seed)
            print(
                f"seeded {seed['item_type']} bgg_id={seed['bgg_id']} "
                f"name='{seed['name']}' slug='{game.slug}'"
            )
    finally:
        conn.close()


if __name__ == "__main__":
    main()
