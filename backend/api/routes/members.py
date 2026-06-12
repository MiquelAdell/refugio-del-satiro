from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from backend.api.dependencies import CurrentMember, GameRepo, LoanRepo, MemberRepo
from backend.domain.use_cases.get_member_loans import GetMemberLoansUseCase
from backend.domain.use_cases.validate_member import ValidateMemberUseCase

router = APIRouter(prefix="/api", tags=["members"])


class ValidateMemberResponse(BaseModel):
    member_number: int
    first_name: str
    last_name: str
    active: bool
    last_payment: str | None
    gender_label: str


def _gender_label(gender: str | None) -> str:
    if gender == "Masculino":
        return "socio"
    if gender == "Femenino":
        return "socia"
    return "socio/a"


@router.get("/members/validate", response_model=ValidateMemberResponse)
def validate_member(
    member_repo: MemberRepo,
    number: int = Query(..., description="Número de socio"),
) -> ValidateMemberResponse:
    use_case = ValidateMemberUseCase(member_repo)
    member = use_case.execute(number)
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Socio no encontrado.",
        )
    return ValidateMemberResponse(
        member_number=member.member_number,  # type: ignore[arg-type]
        first_name=member.first_name,
        last_name=member.last_name,
        active=member.is_active,
        last_payment=member.last_payment,
        gender_label=_gender_label(member.gender),
    )


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
