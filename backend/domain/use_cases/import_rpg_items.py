from __future__ import annotations

from dataclasses import dataclass

from backend.data.bgg_client import BggClient, BggRpgItem, resolve_collection_location
from backend.domain.repositories.game_repository import GameRepository
from backend.domain.repositories.loan_repository import LoanRepository
from backend.domain.use_cases.bgg_reconciliation import (
    compute_reconciliation,
    resolve_legacy_removals,
)

ITEM_TYPE = "rpgitem"


@dataclass(frozen=True)
class ImportRpgResult:
    created: int
    updated: int
    total: int
    deactivated: int
    deleted: int
    skip_reason: str | None = None


def _resolve_collection_id(item: BggRpgItem) -> int:
    """See import_games._resolve_collection_id — same fallback rationale."""
    return item.collection_id if item.collection_id is not None else -item.bgg_id


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
        active_ids = frozenset(
            g.bgg_collection_id
            for g in all_local_items
            if g.is_active and g.bgg_collection_id is not None
        )
        legacy_by_bgg_id = {
            game.bgg_id: game
            for game in all_local_items
            if game.bgg_collection_id is None
        }
        legacy_active_count = sum(
            1 for game in legacy_by_bgg_id.values() if game.is_active
        )

        rpg_items = self._bgg_client.fetch_owned_rpg_items()
        fetched_ids = frozenset(_resolve_collection_id(item) for item in rpg_items)

        created = 0
        updated = 0
        for item in rpg_items:
            collection_id = _resolve_collection_id(item)
            existing = self._game_repo.get_by_collection_id(collection_id)
            if existing is None:
                existing = legacy_by_bgg_id.pop(item.bgg_id, None)
            _, was_created = self._game_repo.upsert_by_collection_id(
                bgg_collection_id=collection_id,
                bgg_id=item.bgg_id,
                name=item.name,
                thumbnail_url=item.thumbnail_url,
                image_url=(
                    item.image_url
                    or (existing.image_url if existing is not None else "")
                ),
                year_published=item.year_published,
                bgg_rating=(
                    item.bgg_rating
                    if item.details_loaded
                    else existing.bgg_rating if existing is not None else 0.0
                ),
                location=resolve_collection_location(item.comment),
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
            if was_created:
                created += 1
            else:
                updated += 1

        # Any bgg_id remaining in legacy_by_bgg_id after the upsert loop was
        # not adopted by any fetched item, i.e. it's no longer owned on BGG
        # (the loop pops every bgg_id it encounters). Guarded against the
        # rare case of a shared bgg_id already claimed by another row's
        # collection_id by also checking fetched_bgg_ids directly.
        fetched_bgg_ids = frozenset(item.bgg_id for item in rpg_items)
        stale_legacy_games = [
            game
            for game in legacy_by_bgg_id.values()
            if game.is_active and game.bgg_id not in fetched_bgg_ids
        ]

        outcome = compute_reconciliation(
            active_ids,
            fetched_ids,
            ITEM_TYPE,
            extra_active_count=legacy_active_count,
            extra_missing_count=len(stale_legacy_games),
        )
        if outcome.skip_reason is not None:
            stale_legacy_games = []

        # Previously soft-deleted items are re-evaluated every run, independent
        # of the guard above — they're already hidden, so there's no new risk.
        stale_inactive_ids = frozenset(
            g.bgg_collection_id
            for g in all_local_items
            if not g.is_active
            and g.bgg_collection_id is not None
            and g.bgg_collection_id not in fetched_ids
        )
        removal_candidates = outcome.missing_ids | stale_inactive_ids

        lent_ids = frozenset(
            collection_id
            for collection_id in removal_candidates
            if (game := self._game_repo.get_by_collection_id(collection_id)) is not None
            and self._loan_repo.get_active_by_game_id(game.id) is not None
        )
        unlent_ids = removal_candidates - lent_ids

        newly_deactivated = self._game_repo.deactivate_by_collection_ids(lent_ids)
        deleted_ids, blocked_ids = self._game_repo.delete_by_collection_ids(unlent_ids)
        if blocked_ids:
            # Has loan history (FK RESTRICT) but isn't lent right now — keep it
            # hidden since it can't be physically removed.
            self._game_repo.deactivate_by_collection_ids(blocked_ids)

        legacy_deactivated, legacy_deleted = resolve_legacy_removals(
            stale_legacy_games, self._game_repo, self._loan_repo
        )

        return ImportRpgResult(
            created=created,
            updated=updated,
            total=len(rpg_items),
            deactivated=newly_deactivated + len(blocked_ids) + legacy_deactivated,
            deleted=len(deleted_ids) + legacy_deleted,
            skip_reason=outcome.skip_reason,
        )
