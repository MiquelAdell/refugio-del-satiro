from __future__ import annotations

from collections.abc import Collection
from datetime import datetime
from typing import Protocol

from backend.domain.entities.game import Game


class GameRepository(Protocol):
    def get_by_id(self, game_id: int) -> Game | None: ...

    def get_by_slug(self, slug: str) -> Game | None: ...

    def get_by_bgg_id(self, bgg_id: int) -> Game | None: ...

    def list_all(self) -> list[Game]: ...

    def list_by_type(self, item_type: str) -> list[Game]: ...  # active items only

    def list_by_type_including_inactive(self, item_type: str) -> list[Game]: ...

    # active and inactive (soft-deleted) items — used by BGG reconciliation,
    # which must see previously soft-deleted rows too

    def deactivate_by_bgg_ids(self, bgg_ids: Collection[int]) -> int: ...

    def delete_by_bgg_ids(
        self, bgg_ids: Collection[int]
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
