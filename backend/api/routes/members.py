from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from backend.api.dependencies import CurrentMember, GameRepo, LoanRepo
from backend.domain.use_cases.get_member_loans import GetMemberLoansUseCase

router = APIRouter(prefix="/api", tags=["members"])


class ActiveLoanResponse(BaseModel):
    loan_id: int
    game_id: int
    game_name: str
    game_thumbnail_url: str
    game_image_url: str
    borrowed_at: str


@router.get("/my-loans", response_model=list[ActiveLoanResponse])
def get_my_loans(
    member: CurrentMember,
    loan_repo: LoanRepo,
    game_repo: GameRepo,
) -> list[ActiveLoanResponse]:
    use_case = GetMemberLoansUseCase(loan_repo, game_repo)
    loans = use_case.execute(member.id)
    return [
        ActiveLoanResponse(
            loan_id=loan.loan_id,
            game_id=loan.game_id,
            game_name=loan.game_name,
            game_thumbnail_url=loan.game_thumbnail_url,
            game_image_url=loan.game_image_url,
            borrowed_at=loan.borrowed_at,
        )
        for loan in loans
    ]
