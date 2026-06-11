from __future__ import annotations

from backend.domain.entities.game import Game
from backend.domain.repositories.game_repository import GameRepository


class GetRpgItemUseCase:
    def __init__(self, game_repo: GameRepository) -> None:
        self._game_repo = game_repo

    def execute(self, slug: str) -> Game | None:
        game = self._game_repo.get_by_slug(slug)
        if game is None or game.item_type != "rpgitem":
            return None
        return game
