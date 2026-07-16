from __future__ import annotations

from dataclasses import dataclass

from backend.data.bgg_client import BggClient
from backend.domain.repositories.game_repository import GameRepository
from backend.domain.repositories.loan_repository import LoanRepository
from backend.domain.use_cases.bgg_reconciliation import compute_reconciliation

ITEM_TYPE = "rpgitem"


@dataclass(frozen=True)
class ImportRpgResult:
    created: int
    updated: int
    total: int
    deactivated: int
    deleted: int
    skip_reason: str | None = None


class ImportRpgItemsUseCase:
    def __init__(
        self,
        game_repo: GameRepository,
        bgg_client: BggClient,
        loan_repo: LoanRepository,
    ) -> None:
        self._game_repo = game_repo
        self._bgg_client = bgg_client
        self._loan_repo = loan_repo

    def execute(self) -> ImportRpgResult:
        all_local_items = self._game_repo.list_by_type_including_inactive(ITEM_TYPE)
        active_bgg_ids = frozenset(g.bgg_id for g in all_local_items if g.is_active)

        rpg_items = self._bgg_client.fetch_owned_rpg_items()
        fetched_bgg_ids = frozenset(item.bgg_id for item in rpg_items)

        created = 0
        updated = 0
        for item in rpg_items:
            existing = self._game_repo.get_by_bgg_id(item.bgg_id)
            self._game_repo.upsert_by_bgg_id(
                bgg_id=item.bgg_id,
                name=item.name,
                thumbnail_url=item.thumbnail_url,
                image_url=(
                    item.image_url
                    if item.details_loaded
                    else existing.image_url if existing is not None else ""
                ),
                year_published=item.year_published,
                bgg_rating=(
                    item.bgg_rating
                    if item.details_loaded
                    else existing.bgg_rating if existing is not None else 0.0
                ),
                location=existing.location if existing is not None else "armari",
                description=(
                    item.description
                    if item.details_loaded
                    else existing.description if existing is not None else ""
                ),
                categories=(
                    item.categories
                    if item.details_loaded
                    else existing.categories if existing is not None else ()
                ),
                publication_types=(
                    item.publication_types
                    if item.details_loaded
                    else existing.publication_types if existing is not None else ()
                ),
                item_type=ITEM_TYPE,
            )
            if existing is None:
                created += 1
            else:
                updated += 1

        outcome = compute_reconciliation(active_bgg_ids, fetched_bgg_ids, ITEM_TYPE)

        # Previously soft-deleted items are re-evaluated every run, independent
        # of the guard above — they're already hidden, so there's no new risk.
        stale_inactive_ids = frozenset(
            g.bgg_id
            for g in all_local_items
            if not g.is_active and g.bgg_id not in fetched_bgg_ids
        )
        removal_candidates = outcome.missing_bgg_ids | stale_inactive_ids

        lent_ids = frozenset(
            bgg_id
            for bgg_id in removal_candidates
            if (game := self._game_repo.get_by_bgg_id(bgg_id)) is not None
            and self._loan_repo.get_active_by_game_id(game.id) is not None
        )
        unlent_ids = removal_candidates - lent_ids

        newly_deactivated = self._game_repo.deactivate_by_bgg_ids(lent_ids)
        deleted_ids, blocked_ids = self._game_repo.delete_by_bgg_ids(unlent_ids)
        if blocked_ids:
            # Has loan history (FK RESTRICT) but isn't lent right now — keep it
            # hidden since it can't be physically removed.
            self._game_repo.deactivate_by_bgg_ids(blocked_ids)

        return ImportRpgResult(
            created=created,
            updated=updated,
            total=len(rpg_items),
            deactivated=newly_deactivated + len(blocked_ids),
            deleted=len(deleted_ids),
            skip_reason=outcome.skip_reason,
        )
