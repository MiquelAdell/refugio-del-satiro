from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.api.dependencies import (
    OptionalMember,
    get_get_rpg_item_use_case,
    get_list_rpg_items_use_case,
    get_rpg_item_history_use_case,
)
from backend.api.schemas import LoanHistoryEntryResponse
from backend.domain.use_cases.get_game_history import GetGameHistoryUseCase
from backend.domain.use_cases.get_rpg_item import GetRpgItemUseCase
from backend.domain.use_cases.list_rpg_items import ListRpgItemsUseCase
from backend.domain.use_cases.rpg_item_with_status import RpgItemWithStatus

router = APIRouter(prefix="/api/rol", tags=["rpg"])

NOT_FOUND_DETAIL = "Libro no encontrado."


class RpgItemResponse(BaseModel):
    id: int
    bgg_id: int
    name: str
    slug: str
    thumbnail_url: str
    image_url: str
    year_published: int
    bgg_rating: float
    description: str
    categories: list[str]
    publication_types: list[str]
    status: str
    borrower_display_name: str | None
    loan_id: int | None


def _to_response(item: RpgItemWithStatus, *, is_authenticated: bool) -> RpgItemResponse:
    return RpgItemResponse(
        id=item.id,
        bgg_id=item.bgg_id,
        name=item.name,
        slug=item.slug,
        thumbnail_url=item.thumbnail_url,
        image_url=item.image_url,
        year_published=item.year_published,
        bgg_rating=item.bgg_rating,
        description=item.description,
        categories=list(item.categories),
        publication_types=list(item.publication_types),
        status=item.status,
        borrower_display_name=item.borrower_display_name if is_authenticated else None,
        loan_id=item.loan_id if is_authenticated else None,
    )


@router.get("", response_model=list[RpgItemResponse])
def list_rpg_items(
    use_case: Annotated[ListRpgItemsUseCase, Depends(get_list_rpg_items_use_case)],
    member: OptionalMember,
) -> list[RpgItemResponse]:
    is_authenticated = member is not None
    return [
        _to_response(item, is_authenticated=is_authenticated)
        for item in use_case.execute()
    ]


@router.get("/{slug}/history", response_model=list[LoanHistoryEntryResponse])
def get_rpg_item_history(
    slug: str,
    use_case: Annotated[GetGameHistoryUseCase, Depends(get_rpg_item_history_use_case)],
    member: OptionalMember,
) -> list[LoanHistoryEntryResponse]:
    entries = use_case.execute(slug)
    if entries is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=NOT_FOUND_DETAIL,
        )
    is_authenticated = member is not None
    return [
        LoanHistoryEntryResponse(
            member_display_name=e.member_display_name if is_authenticated else None,
            borrowed_at=e.borrowed_at,
            returned_at=e.returned_at,
        )
        for e in entries
    ]


@router.get("/{slug}", response_model=RpgItemResponse)
def get_rpg_item(
    slug: str,
    use_case: Annotated[GetRpgItemUseCase, Depends(get_get_rpg_item_use_case)],
    member: OptionalMember,
) -> RpgItemResponse:
    item = use_case.execute(slug)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=NOT_FOUND_DETAIL,
        )
    return _to_response(item, is_authenticated=member is not None)
