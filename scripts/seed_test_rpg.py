"""Idempotently seed one test RPG item into the dev SQLite DB.

The seeded item provides a stable fixture for the e2e RPG catalog journey
(ludo-4..ludo-6).  It is upserted so re-runs are safe and the slug is
deterministic.

Usage:
    python -m scripts.seed_test_rpg
    # or:
    python scripts/seed_test_rpg.py

Env vars:
    REFUGIO_DB_PATH  (resolved via backend.config.Settings)
"""

from __future__ import annotations

from backend.config import Settings
from backend.data.database import get_connection
from backend.data.repositories.sqlite_game_repository import SqliteGameRepository
from backend.migrations.runner import run_migrations

# A stable fictional RPG entry that doesn't clash with real BGG IDs in use.
# bgg_id 999999999 is safely outside the real ID space.
_RPG_SEED = {
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


def main() -> None:
    settings = Settings()
    conn = get_connection(settings.db_path)
    try:
        run_migrations(conn)
        repo = SqliteGameRepository(conn)
        repo.upsert_by_bgg_id(
            bgg_id=_RPG_SEED["bgg_id"],
            name=_RPG_SEED["name"],
            thumbnail_url=_RPG_SEED["thumbnail_url"],
            image_url=_RPG_SEED["image_url"],
            year_published=_RPG_SEED["year_published"],
            min_players=_RPG_SEED["min_players"],
            max_players=_RPG_SEED["max_players"],
            playing_time=_RPG_SEED["playing_time"],
            bgg_rating=_RPG_SEED["bgg_rating"],
            location=_RPG_SEED["location"],
            item_type=_RPG_SEED["item_type"],
            description=_RPG_SEED["description"],
        )
        game = repo.get_by_bgg_id(_RPG_SEED["bgg_id"])
        print(
            f"seeded rpgitem bgg_id={_RPG_SEED['bgg_id']} "
            f"name='{_RPG_SEED['name']}' slug='{game.slug if game else '?'}'"
        )
    finally:
        conn.close()


if __name__ == "__main__":
    main()
