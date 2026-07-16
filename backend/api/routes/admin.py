from __future__ import annotations

import csv
import io
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
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
from backend.domain.use_cases.import_members import (
    ImportMembersUseCase,
    MemberImportValidationError,
)

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
    last_payment: str | None = None
    gender: str | None = None


class CreateMemberRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    nickname: str | None = None
    phone: str | None = None
    member_number: int | None = None
    last_payment: str | None = None
    gender: str | None = None


class UpdateMemberRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    nickname: str | None = None
    phone: str | None = None
    member_number: int | None = None
    last_payment: str | None = None
    gender: str | None = None
    is_admin: bool = False


class CreateMemberResponse(BaseModel):
    member: MemberListItem
    token_url: str


class SendLinkResponse(BaseModel):
    email_sent: bool
    token_url: str


class OkResponse(BaseModel):
    ok: bool = True


class ImportedMember(BaseModel):
    display_name: str
    email: str
    token_url: str


class ImportMembersResponse(BaseModel):
    created: list[ImportedMember]
    created_count: int
    updated_count: int
    disabled_count: int
    total_rows: int
    skipped_rows: int
    deactivation_skip_reason: str | None


@router.get("/members", response_model=list[MemberListItem])
def list_members(
    _admin: AdminMember,
    member_repo: MemberRepo,
    loan_repo: LoanRepo,
) -> list[MemberListItem]:
    members = member_repo.list_all()
    return [
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
            active_loan_count=len(loan_repo.list_active_by_member_id(m.id)),
            last_payment=m.last_payment,
            gender=m.gender,
        )
        for m in members
    ]


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
        last_payment=body.last_payment,
        gender=body.gender,
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
            last_payment=member.last_payment,
            gender=member.gender,
        ),
        token_url=token_url,
    )


@router.post("/members/import", response_model=ImportMembersResponse)
async def import_members(
    file: UploadFile,
    _admin: AdminMember,
    member_repo: MemberRepo,
    token_repo: TokenRepo,
) -> ImportMembersResponse:
    raw_bytes = await file.read()
    try:
        text = raw_bytes.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe ser un CSV codificado en UTF-8.",
        ) from exc

    try:
        reader = csv.DictReader(io.StringIO(text, newline=""), strict=True)
        fieldnames = reader.fieldnames
    except csv.Error as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo CSV no tiene un formato válido.",
        ) from exc

    if fieldnames is None or "Email" not in fieldnames:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo CSV debe tener una columna 'Email'.",
        )

    try:
        raw_members = list(reader)
    except csv.Error as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo CSV no tiene un formato válido.",
        ) from exc

    if any(
        None in row or any(value is None for value in row.values())
        for row in raw_members
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Todas las filas del CSV deben tener el mismo número de columnas.",
        )

    use_case = ImportMembersUseCase(member_repo, token_repo, _settings.base_url)
    try:
        result = use_case.execute(raw_members, acting_member_id=_admin.id)
    except MemberImportValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "El archivo CSV contiene datos no válidos. "
                "Revisa los números de socio y vuelve a intentarlo."
            ),
        ) from exc

    return ImportMembersResponse(
        created=[
            ImportedMember(
                display_name=r.member.display_name,
                email=r.member.email,
                token_url=r.token_url,
            )
            for r in result.created
        ],
        created_count=result.created_count,
        updated_count=result.updated_count,
        disabled_count=result.disabled_count,
        total_rows=result.total_rows,
        skipped_rows=result.skipped_count,
        deactivation_skip_reason=result.deactivation_skip_reason,
    )


@router.patch("/members/{member_id}", response_model=OkResponse)
def update_member(
    member_id: int,
    body: UpdateMemberRequest,
    _admin: AdminMember,
    member_repo: MemberRepo,
) -> OkResponse:
    member = member_repo.get_by_id(member_id)
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Socio no encontrado."
        )

    email_owner = member_repo.get_by_email(body.email)
    if email_owner is not None and email_owner.id != member_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un socio con este email.",
        )

    if body.member_number is not None:
        number_owner = member_repo.get_by_member_number(body.member_number)
        if number_owner is not None and number_owner.id != member_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe un socio con este número de socio.",
            )

    display_name = f"{body.first_name} {body.last_name}"
    member_repo.update_member_details(
        member_id,
        member_number=body.member_number,
        first_name=body.first_name,
        last_name=body.last_name,
        nickname=body.nickname,
        phone=body.phone,
        email=body.email,
        display_name=display_name,
        last_payment=body.last_payment,
        gender=body.gender,
    )
    member_repo.set_admin(member_id, body.is_admin)
    return OkResponse()


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
