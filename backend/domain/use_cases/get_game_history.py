from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from backend.domain.repositories.game_repository import GameRepository
from backend.domain.repositories.loan_repository import LoanRepository
from backend.domain.repositories.member_repository import MemberRepository


@dataclass(frozen=True)
class LoanHistoryEntry:
    member_display_name: str
    borrowed_at: datetime
    returned_at: datetime | None


class GetGameHistoryUseCase:
    def __init__(
        self,
        game_repo: GameRepository,
        loan_repo: LoanRepository,
        member_repo: MemberRepository,
    ) -> None:
        self._game_repo = game_repo
        self._loan_repo = loan_repo
        self._member_repo = member_repo

    def execute(self, slug: str) -> list[LoanHistoryEntry] | None:
        """Return loan history for the game identified by ``slug``.

        Returns ``None`` when no game matches the slug, so the caller can
        distinguish "no such game" (404) from "game has no history" ([]).
        """
        game = self._game_repo.get_by_slug(slug)
        if game is None:
            return None
        loans = self._loan_repo.list_by_game_id(game.id)
        return [
            LoanHistoryEntry(
                member_display_name=(
                    member.display_name
                    if (member := self._member_repo.get_by_id(loan.member_id))
                    else "Unknown"
                ),
                borrowed_at=loan.borrowed_at,
                returned_at=loan.returned_at,
            )
            for loan in loans
        ]
