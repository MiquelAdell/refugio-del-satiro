from __future__ import annotations

from backend.domain.repositories.game_repository import GameRepository
from backend.domain.repositories.loan_repository import LoanRepository
from backend.domain.repositories.member_repository import MemberRepository
from backend.domain.use_cases.rpg_item_with_status import (
    RpgItemWithStatus,
    build_rpg_with_status,
)


class ListRpgItemsUseCase:
    def __init__(
        self,
        game_repo: GameRepository,
        loan_repo: LoanRepository,
        member_repo: MemberRepository,
    ) -> None:
        self._game_repo = game_repo
        self._loan_repo = loan_repo
        self._member_repo = member_repo

    def execute(self) -> list[RpgItemWithStatus]:
        return [
            build_rpg_with_status(game, self._loan_repo, self._member_repo)
            for game in self._game_repo.list_by_type("rpgitem")
        ]
