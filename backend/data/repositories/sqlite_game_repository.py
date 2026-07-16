from __future__ import annotations

import json
import sqlite3
from collections.abc import Collection
from datetime import UTC, datetime

from backend.domain.entities.game import Game
from backend.domain.slug import ensure_unique, slugify


def _normalize_metadata(values: tuple[str, ...]) -> tuple[str, ...]:
    cleaned = sorted(
        (value.strip() for value in values if value.strip()),
        key=lambda value: (value.casefold(), value),
    )
    return tuple(
        value
        for index, value in enumerate(cleaned)
        if index == 0 or value.casefold() != cleaned[index - 1].casefold()
    )


def _serialize_metadata(values: tuple[str, ...]) -> str:
    return json.dumps(_normalize_metadata(values), ensure_ascii=False)


def _deserialize_metadata(value: str) -> tuple[str, ...]:
    decoded = json.loads(value)
    return _normalize_metadata(tuple(str(item) for item in decoded))


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
        categories=(
            _deserialize_metadata(row["categories_json"])
            if "categories_json" in keys
            else ()
        ),
        publication_types=(
            _deserialize_metadata(row["publication_types_json"])
            if "publication_types_json" in keys
            else ()
        ),
        is_active=bool(row["is_active"]) if "is_active" in keys else True,
        bgg_collection_id=(
            row["bgg_collection_id"]
            if "bgg_collection_id" in keys and row["bgg_collection_id"] is not None
            else None
        ),
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

    def get_by_collection_id(self, bgg_collection_id: int) -> Game | None:
        row = self._conn.execute(
            "SELECT * FROM games WHERE bgg_collection_id = ?", (bgg_collection_id,)
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

    def deactivate_by_collection_ids(self, collection_ids: Collection[int]) -> int:
        if not collection_ids:
            return 0
        now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        placeholders = ",".join("?" for _ in collection_ids)
        cursor = self._conn.execute(
            f"UPDATE games SET is_active = 0, updated_at = ? "
            f"WHERE bgg_collection_id IN ({placeholders}) AND is_active = 1",
            (now, *collection_ids),
        )
        self._conn.commit()
        return cursor.rowcount

    def delete_by_collection_ids(
        self, collection_ids: Collection[int]
    ) -> tuple[frozenset[int], frozenset[int]]:
        deleted: set[int] = set()
        blocked: set[int] = set()
        for collection_id in collection_ids:
            try:
                cursor = self._conn.execute(
                    "DELETE FROM games WHERE bgg_collection_id = ?", (collection_id,)
                )
                self._conn.commit()
                if cursor.rowcount:
                    deleted.add(collection_id)
            except sqlite3.IntegrityError:
                blocked.add(collection_id)
        return frozenset(deleted), frozenset(blocked)

    def get_last_updated_at(self) -> datetime | None:
        row = self._conn.execute("SELECT MAX(updated_at) AS last FROM games").fetchone()
        return datetime.fromisoformat(row["last"]) if row and row["last"] else None

    def _slug_for_upsert(
        self, existing_id: int | None, existing_name: str | None, name: str
    ) -> str:
        if existing_id is not None and slugify(existing_name or "") == slugify(name):
            row = self._conn.execute(
                "SELECT slug FROM games WHERE id = ?", (existing_id,)
            ).fetchone()
            assert row is not None
            slug = row["slug"]
            assert isinstance(slug, str)
            return slug
        base = slugify(name)
        excluded_id = existing_id if existing_id is not None else -1
        taken_rows = self._conn.execute(
            "SELECT slug FROM games WHERE slug != '' AND id != ?",
            (excluded_id,),
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
        categories: tuple[str, ...] = (),
        publication_types: tuple[str, ...] = (),
    ) -> Game:
        """Legacy path for the JSON-seed import, which has no collection_id."""
        now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        existing = self.get_by_bgg_id(bgg_id)
        slug = self._slug_for_upsert(
            existing.id if existing else None,
            existing.name if existing else None,
            name,
        )
        categories_json = _serialize_metadata(categories)
        publication_types_json = _serialize_metadata(publication_types)
        values = (
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
            categories_json,
            publication_types_json,
            now,
        )
        if existing is not None:
            self._conn.execute(
                """
                UPDATE games SET
                    name = ?, slug = ?, thumbnail_url = ?, image_url = ?,
                    year_published = ?, min_players = ?, max_players = ?,
                    playing_time = ?, bgg_rating = ?, location = ?,
                    item_type = ?, description = ?, categories_json = ?,
                    publication_types_json = ?, is_active = 1, updated_at = ?
                WHERE id = ?
                """,
                (*values, existing.id),
            )
        else:
            self._conn.execute(
                """
                INSERT INTO games (
                    bgg_id, name, slug, thumbnail_url, image_url, year_published,
                    min_players, max_players, playing_time, bgg_rating, location,
                    item_type, description, categories_json,
                    publication_types_json, is_active, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
                """,
                (bgg_id, *values, now),
            )
        self._conn.commit()
        game = self.get_by_bgg_id(bgg_id)
        assert game is not None
        return game

    def upsert_by_collection_id(
        self,
        bgg_collection_id: int,
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
        categories: tuple[str, ...] = (),
        publication_types: tuple[str, ...] = (),
    ) -> tuple[Game, bool]:
        now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        existing = self.get_by_collection_id(bgg_collection_id)
        if existing is None:
            legacy_row = self._conn.execute(
                "SELECT * FROM games WHERE bgg_collection_id IS NULL AND bgg_id = ? "
                "LIMIT 1",
                (bgg_id,),
            ).fetchone()
            existing = _row_to_game(legacy_row) if legacy_row else None

        slug = self._slug_for_upsert(
            existing.id if existing else None,
            existing.name if existing else None,
            name,
        )
        categories_json = _serialize_metadata(categories)
        publication_types_json = _serialize_metadata(publication_types)
        values = (
            bgg_id,
            bgg_collection_id,
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
            categories_json,
            publication_types_json,
            now,
        )
        if existing is not None:
            self._conn.execute(
                """
                UPDATE games SET
                    bgg_id = ?, bgg_collection_id = ?, name = ?, slug = ?,
                    thumbnail_url = ?, image_url = ?, year_published = ?,
                    min_players = ?, max_players = ?, playing_time = ?,
                    bgg_rating = ?, location = ?, item_type = ?, description = ?,
                    categories_json = ?, publication_types_json = ?,
                    is_active = 1, updated_at = ?
                WHERE id = ?
                """,
                (*values, existing.id),
            )
        else:
            self._conn.execute(
                """
                INSERT INTO games (
                    bgg_id, bgg_collection_id, name, slug, thumbnail_url, image_url,
                    year_published, min_players, max_players, playing_time,
                    bgg_rating, location, item_type, description, categories_json,
                    publication_types_json, is_active, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
                """,
                (*values, now),
            )
        self._conn.commit()
        game = self.get_by_collection_id(bgg_collection_id)
        assert game is not None
        return game, existing is None

    def update_details(
        self,
        game_id: int,
        thumbnail_url: str,
        image_url: str,
        min_players: int,
        max_players: int,
        playing_time: int,
        bgg_rating: float,
        description: str = "",
        categories: tuple[str, ...] = (),
    ) -> Game:
        now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        categories_json = _serialize_metadata(categories)
        self._conn.execute(
            """
            UPDATE games SET
                thumbnail_url = ?, image_url = ?, min_players = ?,
                max_players = ?, playing_time = ?, bgg_rating = ?, description = ?,
                categories_json = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                thumbnail_url,
                image_url,
                min_players,
                max_players,
                playing_time,
                bgg_rating,
                description,
                categories_json,
                now,
                game_id,
            ),
        )
        self._conn.commit()
        game = self.get_by_id(game_id)
        assert game is not None
        return game
