from __future__ import annotations

from dataclasses import dataclass

from backend.domain.repositories.game_repository import GameRepository
from backend.domain.repositories.loan_repository import LoanRepository


@dataclass(frozen=True)
class ActiveLoanWithGame:
    loan_id: int
    game_id: int
    game_name: str
    game_thumbnail_url: str
    game_image_url: str
    borrowed_at: str


class GetMemberLoansUseCase:
    def __init__(
        self,
        loan_repo: LoanRepository,
        game_repo: GameRepository,
    ) -> None:
        self._loan_repo = loan_repo
        self._game_repo = game_repo

    def execute(self, member_id: int) -> list[ActiveLoanWithGame]:
        loans = self._loan_repo.list_active_by_member_id(member_id)
        result: list[ActiveLoanWithGame] = []
        for loan in loans:
            game = self._game_repo.get_by_id(loan.game_id)
            if game is None:
                continue
            result.append(
                ActiveLoanWithGame(
                    loan_id=loan.id,
                    game_id=game.id,
                    game_name=game.name,
                    game_thumbnail_url=game.thumbnail_url,
                    game_image_url=game.image_url,
                    borrowed_at=loan.borrowed_at.isoformat(),
                )
            )
        return result
