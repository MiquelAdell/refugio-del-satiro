from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.api.dependencies import (
    CurrentMember,
    LoanRepo,
    MemberRepo,
    TokenRepo,
    _settings,
)
from backend.data.email_client import EmailClient
from backend.domain.entities.member import Member

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _require_admin(member: CurrentMember) -> Member:
    if not member.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido a administradores.",
        )
    return member


AdminMember = Annotated[Member, Depends(_require_admin)]


class MemberListItem(BaseModel):
    id: int
    member_number: int | None
    first_name: str
    last_name: str
    nickname: str | None
    display_name: str
    email: str
    phone: str | None
    is_admin: bool
    is_active: bool
    active_loan_count: int


class CreateMemberRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    nickname: str | None = None
    phone: str | None = None
    member_number: int | None = None


class CreateMemberResponse(BaseModel):
    member: MemberListItem
    token_url: str


class SendLinkResponse(BaseModel):
    email_sent: bool
    token_url: str


class OkResponse(BaseModel):
    ok: bool = True


@router.get("/members", response_model=list[MemberListItem])
def list_members(
    _admin: AdminMember,
    member_repo: MemberRepo,
    loan_repo: LoanRepo,
) -> list[MemberListItem]:
    members = member_repo.list_all()
    result = []
    for m in members:
        active_loans = loan_repo.list_active_by_member_id(m.id)
        result.append(
            MemberListItem(
                id=m.id,
                member_number=m.member_number,
                first_name=m.first_name,
                last_name=m.last_name,
                nickname=m.nickname,
                display_name=m.display_name,
                email=m.email,
                phone=m.phone,
                is_admin=m.is_admin,
                is_active=m.is_active,
                active_loan_count=len(active_loans),
            )
        )
    return result


@router.post(
    "/members", response_model=CreateMemberResponse, status_code=status.HTTP_201_CREATED
)
def create_member(
    body: CreateMemberRequest,
    _admin: AdminMember,
    member_repo: MemberRepo,
    token_repo: TokenRepo,
) -> CreateMemberResponse:
    existing = member_repo.get_by_email(body.email)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un socio con este email.",
        )

    display_name = f"{body.first_name} {body.last_name}"
    member = member_repo.upsert_by_email(
        member_number=body.member_number,
        first_name=body.first_name,
        last_name=body.last_name,
        nickname=body.nickname,
        phone=body.phone,
        email=body.email,
        display_name=display_name,
        is_admin=False,
    )

    token = token_repo.create(member.id)
    token_url = f"{_settings.base_url}/set-password?token={token.token}"

    return CreateMemberResponse(
        member=MemberListItem(
            id=member.id,
            member_number=member.member_number,
            first_name=member.first_name,
            last_name=member.last_name,
            nickname=member.nickname,
            display_name=member.display_name,
            email=member.email,
            phone=member.phone,
            is_admin=member.is_admin,
            is_active=member.is_active,
            active_loan_count=0,
        ),
        token_url=token_url,
    )


@router.patch("/members/{member_id}/disable", response_model=OkResponse)
def disable_member(
    member_id: int,
    _admin: AdminMember,
    member_repo: MemberRepo,
) -> OkResponse:
    member = member_repo.get_by_id(member_id)
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Socio no encontrado."
        )
    member_repo.set_active(member_id, False)
    return OkResponse()


@router.patch("/members/{member_id}/enable", response_model=OkResponse)
def enable_member(
    member_id: int,
    _admin: AdminMember,
    member_repo: MemberRepo,
) -> OkResponse:
    member = member_repo.get_by_id(member_id)
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Socio no encontrado."
        )
    member_repo.set_active(member_id, True)
    return OkResponse()


@router.post("/members/{member_id}/send-access-link", response_model=SendLinkResponse)
def send_access_link(
    member_id: int,
    _admin: AdminMember,
    member_repo: MemberRepo,
    token_repo: TokenRepo,
) -> SendLinkResponse:
    member = member_repo.get_by_id(member_id)
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Socio no encontrado."
        )

    token = token_repo.create(member.id)
    token_url = f"{_settings.base_url}/set-password?token={token.token}"

    email_client = EmailClient(_settings)
    email_sent = email_client.send_access_link(
        member.email, member.display_name, token_url
    )

    return SendLinkResponse(email_sent=email_sent, token_url=token_url)
