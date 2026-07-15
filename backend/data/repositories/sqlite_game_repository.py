from __future__ import annotations

import sqlite3
from collections.abc import Collection
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
        item_type=row["item_type"] if "item_type" in keys else "boardgame",
        description=row["description"] if "description" in keys else "",
        is_active=bool(row["is_active"]) if "is_active" in keys else True,
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

    def list_by_type(self, item_type: str) -> list[Game]:
        rows = self._conn.execute(
            "SELECT * FROM games WHERE item_type = ? AND is_active = 1 ORDER BY name",
            (item_type,),
        ).fetchall()
        return [_row_to_game(row) for row in rows]

    def list_by_type_including_inactive(self, item_type: str) -> list[Game]:
        rows = self._conn.execute(
            "SELECT * FROM games WHERE item_type = ? ORDER BY name", (item_type,)
        ).fetchall()
        return [_row_to_game(row) for row in rows]

    def deactivate_by_bgg_ids(self, bgg_ids: Collection[int]) -> int:
        if not bgg_ids:
            return 0
        now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        placeholders = ",".join("?" for _ in bgg_ids)
        cursor = self._conn.execute(
            f"UPDATE games SET is_active = 0, updated_at = ? "
            f"WHERE bgg_id IN ({placeholders}) AND is_active = 1",
            (now, *bgg_ids),
        )
        self._conn.commit()
        return cursor.rowcount

    def delete_by_bgg_ids(
        self, bgg_ids: Collection[int]
    ) -> tuple[frozenset[int], frozenset[int]]:
        deleted: set[int] = set()
        blocked: set[int] = set()
        for bgg_id in bgg_ids:
            try:
                cursor = self._conn.execute(
                    "DELETE FROM games WHERE bgg_id = ?", (bgg_id,)
                )
                self._conn.commit()
                if cursor.rowcount:
                    deleted.add(bgg_id)
            except sqlite3.IntegrityError:
                blocked.add(bgg_id)
        return frozenset(deleted), frozenset(blocked)

    def get_last_updated_at(self) -> datetime | None:
        row = self._conn.execute("SELECT MAX(updated_at) AS last FROM games").fetchone()
        return datetime.fromisoformat(row["last"]) if row and row["last"] else None

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
        item_type: str = "boardgame",
        description: str = "",
    ) -> Game:
        now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        slug = self._slug_for_upsert(bgg_id, name)
        self._conn.execute(
            """
            INSERT INTO games (
                bgg_id, name, slug, thumbnail_url, image_url, year_published,
                min_players, max_players, playing_time, bgg_rating, location,
                item_type, description, is_active, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
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
                item_type = excluded.item_type,
                description = excluded.description,
                is_active = 1,
                updated_at = ?
            """,
            (
                bgg_id,
                name,
                slug,
                thumbnail_url,
                image_url,
                year_published,
                min_players,
                max_players,
                playing_time,
                bgg_rating,
                location,
                item_type,
                description,
                now,
                now,
                now,
            ),
        )
        self._conn.commit()
        game = self.get_by_bgg_id(bgg_id)
        assert game is not None
        return game
