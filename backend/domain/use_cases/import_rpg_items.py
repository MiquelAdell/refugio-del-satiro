from __future__ import annotations

from dataclasses import dataclass

from backend.data.bgg_client import BggClient
from backend.domain.repositories.game_repository import GameRepository


@dataclass(frozen=True)
class ImportRpgResult:
    created: int
    updated: int
    total: int


class ImportRpgItemsUseCase:
    def __init__(
        self,
        game_repo: GameRepository,
        bgg_client: BggClient,
    ) -> None:
        self._game_repo = game_repo
        self._bgg_client = bgg_client

    def execute(self) -> ImportRpgResult:
        rpg_items = self._bgg_client.fetch_owned_rpg_items()
        created = 0
        updated = 0

        for item in rpg_items:
            existing = self._game_repo.get_by_bgg_id(item.bgg_id)
            self._game_repo.upsert_by_bgg_id(
                bgg_id=item.bgg_id,
                name=item.name,
                thumbnail_url=item.thumbnail_url,
                image_url=item.image_url,
                year_published=item.year_published,
                bgg_rating=item.bgg_rating,
                description=item.description,
                item_type="rpgitem",
            )
            if existing is None:
                created += 1
            else:
                updated += 1

        return ImportRpgResult(
            created=created,
            updated=updated,
            total=len(rpg_items),
        )
