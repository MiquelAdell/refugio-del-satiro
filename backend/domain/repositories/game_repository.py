from __future__ import annotations

from datetime import datetime
from typing import Protocol

from backend.domain.entities.game import Game


class GameRepository(Protocol):
    def get_by_id(self, game_id: int) -> Game | None: ...

    def get_by_slug(self, slug: str) -> Game | None: ...

    def get_by_bgg_id(self, bgg_id: int) -> Game | None: ...

    def list_all(self) -> list[Game]: ...

    def list_by_type(self, item_type: str) -> list[Game]: ...

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
