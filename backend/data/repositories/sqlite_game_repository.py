from __future__ import annotations

import sqlite3
from datetime import UTC, datetime

from backend.domain.entities.game import Game
from backend.domain.slug import ensure_unique, slugify


def _row_to_game(row: sqlite3.Row) -> Game:
    keys = row.keys()
    return Game(
        id=row["id"],
        bgg_id=row["bgg_id"],
        name=row["name"],
        slug=row["slug"] if "slug" in keys else "",
        thumbnail_url=row["thumbnail_url"],
        image_url=row["image_url"] if "image_url" in keys else "",
        year_published=row["year_published"],
        min_players=row["min_players"] if "min_players" in keys else 0,
        max_players=row["max_players"] if "max_players" in keys else 0,
        playing_time=row["playing_time"] if "playing_time" in keys else 0,
        bgg_rating=row["bgg_rating"] if "bgg_rating" in keys else 0.0,
        location=row["location"] if "location" in keys else "armari",
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
    )


class SqliteGameRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def get_by_id(self, game_id: int) -> Game | None:
        row = self._conn.execute(
            "SELECT * FROM games WHERE id = ?", (game_id,)
        ).fetchone()
        return _row_to_game(row) if row else None

    def get_by_slug(self, slug: str) -> Game | None:
        row = self._conn.execute(
            "SELECT * FROM games WHERE slug = ?", (slug,)
        ).fetchone()
        return _row_to_game(row) if row else None

    def get_by_bgg_id(self, bgg_id: int) -> Game | None:
        row = self._conn.execute(
            "SELECT * FROM games WHERE bgg_id = ?", (bgg_id,)
        ).fetchone()
        return _row_to_game(row) if row else None

    def list_all(self) -> list[Game]:
        rows = self._conn.execute("SELECT * FROM games ORDER BY name").fetchall()
        return [_row_to_game(row) for row in rows]

    def _slug_for_upsert(self, bgg_id: int, name: str) -> str:
        existing = self.get_by_bgg_id(bgg_id)
        if existing is not None and slugify(existing.name) == slugify(name):
            return existing.slug
        base = slugify(name)
        taken_rows = self._conn.execute(
            "SELECT slug FROM games WHERE slug != '' AND bgg_id != ?",
            (bgg_id,),
        ).fetchall()
        return ensure_unique(base, (row["slug"] for row in taken_rows))

    def upsert_by_bgg_id(
        self,
        bgg_id: int,
        name: str,
        thumbnail_url: str,
        image_url: str = "",
        year_published: int = 0,
        min_players: int = 0,
        max_players: int = 0,
        playing_time: int = 0,
        bgg_rating: float = 0.0,
        location: str = "armari",
    ) -> Game:
        now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        slug = self._slug_for_upsert(bgg_id, name)
        self._conn.execute(
            """
            INSERT INTO games (bgg_id, name, slug, thumbnail_url, image_url, year_published, min_players, max_players, playing_time, bgg_rating, location, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(bgg_id) DO UPDATE SET
                name = excluded.name,
                slug = excluded.slug,
                thumbnail_url = excluded.thumbnail_url,
                image_url = excluded.image_url,
                year_published = excluded.year_published,
                min_players = excluded.min_players,
                max_players = excluded.max_players,
                playing_time = excluded.playing_time,
                bgg_rating = excluded.bgg_rating,
                location = excluded.location,
                updated_at = ?
            """,
            (bgg_id, name, slug, thumbnail_url, image_url, year_published, min_players, max_players, playing_time, bgg_rating, location, now, now, now),
        )
        self._conn.commit()
        game = self.get_by_bgg_id(bgg_id)
        assert game is not None
        return game
