from __future__ import annotations

from dataclasses import dataclass

from backend.domain.entities.game import ItemType
from backend.domain.repositories.game_repository import GameRepository
from backend.domain.repositories.loan_repository import LoanRepository
from backend.domain.repositories.member_repository import MemberRepository


@dataclass(frozen=True)
class ActiveLoanWithBorrower:
    loan_id: int
    game_id: int
    game_name: str
    game_slug: str
    item_type: ItemType
    game_thumbnail_url: str
    game_image_url: str
    member_id: int
    member_display_name: str
    borrowed_at: str


class GetActiveLoansUseCase:
    def __init__(
        self,
        loan_repo: LoanRepository,
        game_repo: GameRepository,
        member_repo: MemberRepository,
    ) -> None:
        self._loan_repo = loan_repo
        self._game_repo = game_repo
        self._member_repo = member_repo

    def execute(self) -> list[ActiveLoanWithBorrower]:
        return [
            ActiveLoanWithBorrower(
                loan_id=loan.id,
                game_id=game.id,
                game_name=game.name,
                game_slug=game.slug,
                item_type=game.item_type,
                game_thumbnail_url=game.thumbnail_url,
                game_image_url=game.image_url,
                member_id=member.id,
                member_display_name=member.display_name,
                borrowed_at=loan.borrowed_at.isoformat(),
            )
            for loan in self._loan_repo.list_active()
            if (game := self._game_repo.get_by_id(loan.game_id)) is not None
            if (member := self._member_repo.get_by_id(loan.member_id)) is not None
        ]
