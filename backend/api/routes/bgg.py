"""Admin-only BGG collection import endpoint."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.api.dependencies import CurrentMember, GameRepo, _settings
from backend.data.bgg_client import BggClient
from backend.domain.entities.member import Member
from backend.domain.use_cases.import_games import ImportGamesUseCase

router = APIRouter(prefix="/api/admin/bgg", tags=["admin", "bgg"])


def _require_admin(member: CurrentMember) -> Member:
    if not member.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido a administradores.",
        )
    return member


AdminMember = Annotated[Member, Depends(_require_admin)]


class BggStatusResponse(BaseModel):
    last_imported_at: datetime | None


class BggImportResponse(BaseModel):
    created: int
    updated: int
    total: int
    last_imported_at: datetime | None


@router.get("/status", response_model=BggStatusResponse)
def get_status(_admin: AdminMember, game_repo: GameRepo) -> BggStatusResponse:
    return BggStatusResponse(last_imported_at=game_repo.get_last_updated_at())


@router.post("/import", response_model=BggImportResponse)
def import_games(_admin: AdminMember, game_repo: GameRepo) -> BggImportResponse:
    bgg_client = BggClient(
        username="RefugioDelSatiro", bearer_token=_settings.bgg_bearer_token
    )
    use_case = ImportGamesUseCase(game_repo, bgg_client)
    result = use_case.execute()
    return BggImportResponse(
        created=result.created,
        updated=result.updated,
        total=result.total,
        last_imported_at=game_repo.get_last_updated_at(),
    )
