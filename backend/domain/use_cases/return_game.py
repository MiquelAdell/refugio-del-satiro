from __future__ import annotations

from backend.domain.entities.loan import Loan
from backend.domain.entities.member import Member
from backend.domain.repositories.loan_repository import LoanRepository


class ReturnGameError(Exception):
    pass


class ReturnGameUseCase:
    def __init__(self, loan_repo: LoanRepository) -> None:
        self._loan_repo = loan_repo

    def execute(self, loan_id: int, member: Member) -> Loan:
        loan = self._loan_repo.get_by_id(loan_id)
        if loan is None:
            raise ReturnGameError("Préstamo no encontrado.")

        if loan.returned_at is not None:
            raise ReturnGameError("Este juego ya ha sido devuelto.")

        if loan.member_id != member.id and not member.is_admin:
            raise ReturnGameError("Solo puedes devolver tus propios préstamos.")

        return self._loan_repo.mark_returned(loan_id)
