from __future__ import annotations

from backend.domain.entities.game import Game
from backend.domain.repositories.game_repository import GameRepository


class ListRpgItemsUseCase:
    def __init__(self, game_repo: GameRepository) -> None:
        self._game_repo = game_repo

    def execute(self) -> list[Game]:
        return self._game_repo.list_by_type("rpgitem")
