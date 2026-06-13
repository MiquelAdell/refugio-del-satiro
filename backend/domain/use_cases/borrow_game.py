from __future__ import annotations

from backend.domain.entities.loan import Loan
from backend.domain.repositories.game_repository import GameRepository
from backend.domain.repositories.loan_repository import LoanRepository


class BorrowGameError(Exception):
    pass


class BorrowGameUseCase:
    def __init__(
        self,
        game_repo: GameRepository,
        loan_repo: LoanRepository,
    ) -> None:
        self._game_repo = game_repo
        self._loan_repo = loan_repo

    def execute(self, game_id: int, member_id: int) -> Loan:
        game = self._game_repo.get_by_id(game_id)
        if game is None:
            raise BorrowGameError("Juego no encontrado.")

        active_loan = self._loan_repo.get_active_by_game_id(game_id)
        if active_loan is not None:
            raise BorrowGameError("Este juego ya está prestado.")

        return self._loan_repo.create(game_id, member_id)
