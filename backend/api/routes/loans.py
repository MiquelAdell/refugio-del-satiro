from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from backend.api.dependencies import (
    CurrentMember,
    GameRepo,
    LoanRepo,
)
from backend.domain.use_cases.borrow_game import BorrowGameError, BorrowGameUseCase
from backend.domain.use_cases.return_game import ReturnGameError, ReturnGameUseCase

router = APIRouter(prefix="/api", tags=["loans"])


class BorrowRequest(BaseModel):
    game_id: int


class LoanResponse(BaseModel):
    id: int
    game_id: int
    member_id: int
    borrowed_at: str
    returned_at: str | None


class OkResponse(BaseModel):
    ok: bool = True


@router.post("/loans", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
def borrow_game(
    body: BorrowRequest,
    member: CurrentMember,
    game_repo: GameRepo,
    loan_repo: LoanRepo,
) -> LoanResponse:
    use_case = BorrowGameUseCase(game_repo, loan_repo)
    try:
        loan = use_case.execute(body.game_id, member.id)
    except BorrowGameError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e)) from e
    return LoanResponse(
        id=loan.id,
        game_id=loan.game_id,
        member_id=loan.member_id,
        borrowed_at=loan.borrowed_at.isoformat(),
        returned_at=None,
    )


@router.patch("/loans/{loan_id}/return", response_model=LoanResponse)
def return_game(
    loan_id: int,
    member: CurrentMember,
    loan_repo: LoanRepo,
) -> LoanResponse:
    use_case = ReturnGameUseCase(loan_repo)
    try:
        loan = use_case.execute(loan_id, member)
    except ReturnGameError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e)) from e
    return LoanResponse(
        id=loan.id,
        game_id=loan.game_id,
        member_id=loan.member_id,
        borrowed_at=loan.borrowed_at.isoformat(),
        returned_at=loan.returned_at.isoformat() if loan.returned_at else None,
    )
