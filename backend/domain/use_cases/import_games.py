from __future__ import annotations

from dataclasses import dataclass

from backend.data.bgg_client import BggClient
from backend.domain.repositories.game_repository import GameRepository


@dataclass(frozen=True)
class ImportResult:
    created: int
    updated: int
    total: int


class ImportGamesUseCase:
    def __init__(
        self,
        game_repo: GameRepository,
        bgg_client: BggClient,
    ) -> None:
        self._game_repo = game_repo
        self._bgg_client = bgg_client

    def execute(self) -> ImportResult:
        bgg_games = self._bgg_client.fetch_owned_games()
        created = 0
        updated = 0

        for bgg_game in bgg_games:
            existing = self._game_repo.get_by_bgg_id(bgg_game.bgg_id)
            self._game_repo.upsert_by_bgg_id(
                bgg_id=bgg_game.bgg_id,
                name=bgg_game.name,
                thumbnail_url=bgg_game.thumbnail_url,
                image_url="",
                year_published=bgg_game.year_published,
            )
            if existing is None:
                created += 1
            else:
                updated += 1

        return ImportResult(
            created=created,
            updated=updated,
            total=len(bgg_games),
        )
