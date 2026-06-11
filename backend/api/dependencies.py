from __future__ import annotations

import sqlite3
from collections.abc import Generator
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status

from backend.api.auth import decode_jwt, get_token_from_request
from backend.config import Settings
from backend.data.database import get_connection
from backend.data.repositories.sqlite_game_repository import SqliteGameRepository
from backend.data.repositories.sqlite_loan_repository import SqliteLoanRepository
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
from backend.data.repositories.sqlite_password_token_repository import (
    SqlitePasswordTokenRepository,
)
from backend.domain.entities.member import Member
from backend.domain.use_cases.authenticate import AuthenticateUseCase
from backend.domain.use_cases.get_game import GetGameUseCase
from backend.domain.use_cases.get_game_history import GetGameHistoryUseCase
from backend.domain.use_cases.get_rpg_item import GetRpgItemUseCase
from backend.domain.use_cases.list_games import ListGamesUseCase
from backend.domain.use_cases.list_rpg_items import ListRpgItemsUseCase
from backend.domain.use_cases.request_password_reset import RequestPasswordResetUseCase
from backend.domain.use_cases.set_password import SetPasswordUseCase
from backend.migrations.runner import run_migrations

_settings = Settings()
_migrations_run = False


def get_db_conn() -> Generator[sqlite3.Connection, None, None]:
    global _migrations_run  # noqa: PLW0603
    conn = get_connection(_settings.db_path)
    if not _migrations_run:
        run_migrations(conn)
        _migrations_run = True
    try:
        yield conn
    finally:
        conn.close()


DbConn = Annotated[sqlite3.Connection, Depends(get_db_conn)]


def get_game_repo(conn: DbConn) -> SqliteGameRepository:
    return SqliteGameRepository(conn)


def get_member_repo(conn: DbConn) -> SqliteMemberRepository:
    return SqliteMemberRepository(conn)


def get_loan_repo(conn: DbConn) -> SqliteLoanRepository:
    return SqliteLoanRepository(conn)


def get_token_repo(conn: DbConn) -> SqlitePasswordTokenRepository:
    return SqlitePasswordTokenRepository(conn)


GameRepo = Annotated[SqliteGameRepository, Depends(get_game_repo)]
MemberRepo = Annotated[SqliteMemberRepository, Depends(get_member_repo)]
LoanRepo = Annotated[SqliteLoanRepository, Depends(get_loan_repo)]
TokenRepo = Annotated[SqlitePasswordTokenRepository, Depends(get_token_repo)]


def get_list_games_use_case(
    game_repo: GameRepo,
    loan_repo: LoanRepo,
    member_repo: MemberRepo,
) -> ListGamesUseCase:
    return ListGamesUseCase(game_repo, loan_repo, member_repo)


def get_game_use_case(
    game_repo: GameRepo,
    loan_repo: LoanRepo,
    member_repo: MemberRepo,
) -> GetGameUseCase:
    return GetGameUseCase(game_repo, loan_repo, member_repo)


def get_game_history_use_case(
    game_repo: GameRepo,
    loan_repo: LoanRepo,
    member_repo: MemberRepo,
) -> GetGameHistoryUseCase:
    return GetGameHistoryUseCase(game_repo, loan_repo, member_repo)


def get_list_rpg_items_use_case(game_repo: GameRepo) -> ListRpgItemsUseCase:
    return ListRpgItemsUseCase(game_repo)


def get_get_rpg_item_use_case(game_repo: GameRepo) -> GetRpgItemUseCase:
    return GetRpgItemUseCase(game_repo)


def get_authenticate_use_case(member_repo: MemberRepo) -> AuthenticateUseCase:
    return AuthenticateUseCase(member_repo)


def get_set_password_use_case(
    member_repo: MemberRepo,
    token_repo: TokenRepo,
) -> SetPasswordUseCase:
    return SetPasswordUseCase(member_repo, token_repo)


def get_request_password_reset_use_case(
    member_repo: MemberRepo,
    token_repo: TokenRepo,
) -> RequestPasswordResetUseCase:
    from backend.data.email_client import EmailClient

    return RequestPasswordResetUseCase(
        member_repo, token_repo, EmailClient(_settings), _settings
    )


def get_current_member(request: Request, member_repo: MemberRepo) -> Member | None:
    """Optional auth — returns Member or None."""
    token = get_token_from_request(request)
    if not token:
        return None
    member_id = decode_jwt(token, _settings.jwt_secret)
    if member_id is None:
        return None
    return member_repo.get_by_id(member_id)


def require_current_member(
    member: Annotated[Member | None, Depends(get_current_member)],
) -> Member:
    """Required auth — raises 401 if not logged in."""
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cal iniciar sessió.",
        )
    return member


CurrentMember = Annotated[Member, Depends(require_current_member)]
OptionalMember = Annotated[Member | None, Depends(get_current_member)]
