from __future__ import annotations

import logging
from dataclasses import dataclass

from backend.domain.entities.loan import Loan
from backend.domain.entities.member import Member
from backend.domain.repositories.game_repository import GameRepository
from backend.domain.repositories.loan_repository import LoanRepository
from backend.domain.repositories.member_repository import MemberRepository
from backend.domain.services.loan_return_notifier import LoanReturnNotifier

logger = logging.getLogger(__name__)


class ReturnGameError(Exception):
    pass


@dataclass(frozen=True)
class ReturnGameResult:
    loan: Loan
    forced_return_email_sent: bool | None


class ReturnGameUseCase:
    def __init__(
        self,
        loan_repo: LoanRepository,
        member_repo: MemberRepository,
        game_repo: GameRepository,
        notifier: LoanReturnNotifier,
    ) -> None:
        self._loan_repo = loan_repo
        self._member_repo = member_repo
        self._game_repo = game_repo
        self._notifier = notifier

    def execute(self, loan_id: int, member: Member) -> ReturnGameResult:
        loan = self._loan_repo.get_by_id(loan_id)
        if loan is None:
            raise ReturnGameError("Préstamo no encontrado.")

        if loan.returned_at is not None:
            raise ReturnGameError("Este juego ya ha sido devuelto.")

        if loan.member_id != member.id and not member.is_admin:
            raise ReturnGameError("Solo puedes devolver tus propios préstamos.")

        returned_loan = self._loan_repo.mark_returned(loan_id)
        if loan.member_id == member.id:
            return ReturnGameResult(returned_loan, None)

        try:
            borrower = self._member_repo.get_by_id(loan.member_id)
            game = self._game_repo.get_by_id(loan.game_id)
            if (
                borrower is None
                or game is None
                or not borrower.email.strip()
                or not borrower.display_name.strip()
                or not game.name.strip()
            ):
                logger.warning(
                    "Forced return notification data unavailable for loan_id=%s",
                    loan_id,
                )
                return ReturnGameResult(returned_loan, False)

            email_sent = self._notifier.send_forced_return(
                borrower.email,
                borrower.display_name,
                game.name,
            )
        except Exception:
            logger.exception(
                "Forced return notification preparation or delivery failed for loan_id=%s",
                loan_id,
            )
            email_sent = False

        return ReturnGameResult(returned_loan, email_sent)
