from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.api.dependencies import (
    get_get_rpg_item_use_case,
    get_list_rpg_items_use_case,
)
from backend.domain.use_cases.get_rpg_item import GetRpgItemUseCase
from backend.domain.use_cases.list_rpg_items import ListRpgItemsUseCase

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


@router.get("", response_model=list[RpgItemResponse])
def list_rpg_items(
    use_case: Annotated[ListRpgItemsUseCase, Depends(get_list_rpg_items_use_case)],
) -> list[RpgItemResponse]:
    return [
        RpgItemResponse(
            id=item.id,
            bgg_id=item.bgg_id,
            name=item.name,
            slug=item.slug,
            thumbnail_url=item.thumbnail_url,
            image_url=item.image_url,
            year_published=item.year_published,
            bgg_rating=item.bgg_rating,
            description=item.description,
        )
        for item in use_case.execute()
    ]


@router.get("/{slug}", response_model=RpgItemResponse)
def get_rpg_item(
    slug: str,
    use_case: Annotated[GetRpgItemUseCase, Depends(get_get_rpg_item_use_case)],
) -> RpgItemResponse:
    item = use_case.execute(slug)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=NOT_FOUND_DETAIL,
        )
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
    )
