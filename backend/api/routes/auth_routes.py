from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel

from backend.api.auth import clear_auth_cookie, create_jwt, set_auth_cookie
from backend.api.dependencies import (
    CurrentMember,
    _settings,
    get_authenticate_use_case,
    get_change_password_use_case,
    get_request_password_reset_use_case,
    get_set_password_use_case,
)
from backend.domain.entities.member import Member
from backend.domain.use_cases.authenticate import AuthenticateUseCase
from backend.domain.use_cases.change_password import (
    ChangePasswordError,
    ChangePasswordUseCase,
)
from backend.domain.use_cases.request_password_reset import RequestPasswordResetUseCase
from backend.domain.use_cases.set_password import SetPasswordError, SetPasswordUseCase

router = APIRouter(prefix="/api", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class SetPasswordRequest(BaseModel):
    token: str
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class MemberResponse(BaseModel):
    id: int
    display_name: str
    email: str
    is_admin: bool


class OkResponse(BaseModel):
    ok: bool = True


def _member_to_response(member: Member) -> MemberResponse:
    return MemberResponse(
        id=member.id,
        display_name=member.display_name,
        email=member.email,
        is_admin=member.is_admin,
    )


@router.post("/login", response_model=OkResponse)
def login(
    body: LoginRequest,
    response: Response,
    auth_use_case: Annotated[AuthenticateUseCase, Depends(get_authenticate_use_case)],
) -> OkResponse:
    member = auth_use_case.execute(body.email, body.password)
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credencials incorrectes.",
        )
    token = create_jwt(member.id, _settings.jwt_secret)
    set_auth_cookie(response, token)
    return OkResponse()


@router.post("/logout", response_model=OkResponse)
def logout(response: Response) -> OkResponse:
    clear_auth_cookie(response)
    return OkResponse()


@router.get("/me", response_model=MemberResponse)
def get_me(member: CurrentMember) -> MemberResponse:
    return _member_to_response(member)


@router.post("/change-password", response_model=OkResponse)
def change_password(
    body: ChangePasswordRequest,
    member: CurrentMember,
    use_case: Annotated[ChangePasswordUseCase, Depends(get_change_password_use_case)],
) -> OkResponse:
    try:
        use_case.execute(member, body.current_password, body.new_password)
    except ChangePasswordError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    return OkResponse()


@router.post("/forgot-password", response_model=OkResponse)
def forgot_password(
    body: ForgotPasswordRequest,
    use_case: Annotated[
        RequestPasswordResetUseCase, Depends(get_request_password_reset_use_case)
    ],
) -> OkResponse:
    use_case.execute(body.email)
    return OkResponse()


@router.post("/set-password", response_model=OkResponse)
def set_password(
    body: SetPasswordRequest,
    use_case: Annotated[SetPasswordUseCase, Depends(get_set_password_use_case)],
) -> OkResponse:
    try:
        use_case.execute(body.token, body.password)
    except SetPasswordError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    return OkResponse()
