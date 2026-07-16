"""Admin-only BGG collection import endpoint."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.api.dependencies import CurrentMember, GameRepo, LoanRepo, _settings
from backend.data.bgg_client import BggClient
from backend.domain.entities.member import Member
from backend.domain.use_cases.import_games import ImportGamesUseCase
from backend.domain.use_cases.import_rpg_items import ImportRpgItemsUseCase

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


class BggImportStats(BaseModel):
    created: int
    updated: int
    total: int
    deleted: int
    deactivated: int
    skip_reason: str | None


class BggCatalogOutcome(BaseModel):
    result: BggImportStats | None
    error: str | None


class BggImportResponse(BaseModel):
    boardgames: BggCatalogOutcome
    rpg_items: BggCatalogOutcome
    last_imported_at: datetime | None


@router.get("/status", response_model=BggStatusResponse)
def get_status(_admin: AdminMember, game_repo: GameRepo) -> BggStatusResponse:
    return BggStatusResponse(last_imported_at=game_repo.get_last_updated_at())


@router.post("/import", response_model=BggImportResponse)
def import_games(
    _admin: AdminMember, game_repo: GameRepo, loan_repo: LoanRepo
) -> BggImportResponse:
    bgg_client = BggClient(
        username="RefugioDelSatiro", bearer_token=_settings.bgg_bearer_token
    )
    boardgames_use_case = ImportGamesUseCase(game_repo, bgg_client, loan_repo)
    rpg_items_use_case = ImportRpgItemsUseCase(game_repo, bgg_client, loan_repo)

    try:
        boardgames_result = boardgames_use_case.execute()
        boardgames = BggCatalogOutcome(
            result=BggImportStats(
                created=boardgames_result.created,
                updated=boardgames_result.updated,
                total=boardgames_result.total,
                deleted=boardgames_result.deleted,
                deactivated=boardgames_result.deactivated,
                skip_reason=boardgames_result.skip_reason,
            ),
            error=None,
        )
    except Exception:  # noqa: BLE001
        boardgames = BggCatalogOutcome(
            result=None,
            error="No se han podido sincronizar los juegos de mesa.",
        )

    try:
        rpg_items_result = rpg_items_use_case.execute()
        rpg_items = BggCatalogOutcome(
            result=BggImportStats(
                created=rpg_items_result.created,
                updated=rpg_items_result.updated,
                total=rpg_items_result.total,
                deleted=rpg_items_result.deleted,
                deactivated=rpg_items_result.deactivated,
                skip_reason=rpg_items_result.skip_reason,
            ),
            error=None,
        )
    except Exception:  # noqa: BLE001
        rpg_items = BggCatalogOutcome(
            result=None,
            error="No se han podido sincronizar los juegos de rol.",
        )

    return BggImportResponse(
        boardgames=boardgames,
        rpg_items=rpg_items,
        last_imported_at=game_repo.get_last_updated_at(),
    )
