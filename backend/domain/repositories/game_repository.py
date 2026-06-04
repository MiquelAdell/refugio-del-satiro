from __future__ import annotations

from typing import Protocol

from backend.domain.entities.game import Game


class GameRepository(Protocol):
    def get_by_id(self, game_id: int) -> Game | None: ...

    def get_by_slug(self, slug: str) -> Game | None: ...

    def get_by_bgg_id(self, bgg_id: int) -> Game | None: ...

    def list_all(self) -> list[Game]: ...

    def upsert_by_bgg_id(
        self,
        bgg_id: int,
        name: str,
        thumbnail_url: str,
        image_url: str,
        year_published: int,
    ) -> Game: ...
