from __future__ import annotations

from collections.abc import Collection
from datetime import datetime
from typing import Protocol

from backend.domain.entities.game import Game


class GameRepository(Protocol):
    def get_by_id(self, game_id: int) -> Game | None: ...

    def get_by_slug(self, slug: str) -> Game | None: ...

    def get_by_bgg_id(self, bgg_id: int) -> Game | None: ...

    # bgg_id (BGG's objectid) is NOT unique: BGG's collection can list several
    # distinct owned items under one objectid. Returns an arbitrary match —
    # only meant for the JSON-seed import path, which has no collection_id.

    def get_by_collection_id(self, bgg_collection_id: int) -> Game | None: ...

    def list_all(self) -> list[Game]: ...

    def list_by_type(self, item_type: str) -> list[Game]: ...  # active items only

    def list_by_type_including_inactive(self, item_type: str) -> list[Game]: ...

    # active and inactive (soft-deleted) items — used by BGG reconciliation,
    # which must see previously soft-deleted rows too

    def deactivate_by_collection_ids(self, collection_ids: Collection[int]) -> int: ...

    def delete_by_collection_ids(
        self, collection_ids: Collection[int]
    ) -> tuple[frozenset[int], frozenset[int]]: ...  # (deleted, blocked_by_history)

    def get_last_updated_at(self) -> datetime | None: ...

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
    ) -> Game: ...

    # legacy path: JSON-seed import, which has no collection_id concept

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
    ) -> tuple[Game, bool]: ...  # (game, was_created)

    # Match rule: (1) an existing row with this bgg_collection_id, (2) else a
    # legacy row (bgg_collection_id IS NULL) matching bgg_id, which adopts
    # this collection_id, (3) else a newly created row.

    def update_details(
        self,
        game_id: int,
        thumbnail_url: str,
        image_url: str,
        min_players: int,
        max_players: int,
        playing_time: int,
        bgg_rating: float,
    ) -> Game: ...

    # Updates by primary key, not bgg_id — enrich_games fetches shared
    # attributes from BGG's thing API keyed by bgg_id/objectid, which can be
    # shared by several distinct rows, so callers must resolve the target
    # row themselves rather than relying on bgg_id-keyed matching here.
