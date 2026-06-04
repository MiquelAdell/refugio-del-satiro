from __future__ import annotations

from backend.domain.repositories.game_repository import GameRepository
from backend.domain.repositories.loan_repository import LoanRepository
from backend.domain.repositories.member_repository import MemberRepository
from backend.domain.use_cases.list_games import GameWithStatus, build_game_with_status


class GetGameUseCase:
    def __init__(
        self,
        game_repo: GameRepository,
        loan_repo: LoanRepository,
        member_repo: MemberRepository,
    ) -> None:
        self._game_repo = game_repo
        self._loan_repo = loan_repo
        self._member_repo = member_repo

    def execute(self, slug: str) -> GameWithStatus | None:
        game = self._game_repo.get_by_slug(slug)
        if game is None:
            return None
        return build_game_with_status(game, self._loan_repo, self._member_repo)
