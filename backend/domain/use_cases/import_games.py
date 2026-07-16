from __future__ import annotations

from dataclasses import dataclass

from backend.data.bgg_client import BggClient, BggGame
from backend.domain.repositories.game_repository import GameRepository
from backend.domain.repositories.loan_repository import LoanRepository
from backend.domain.use_cases.bgg_reconciliation import (
    compute_reconciliation,
    resolve_legacy_removals,
)

ITEM_TYPE = "boardgame"


@dataclass(frozen=True)
class ImportResult:
    created: int
    updated: int
    total: int
    deactivated: int
    deleted: int
    skip_reason: str | None = None


def _resolve_collection_id(bgg_game: BggGame) -> int:
    """BGG's per-copy collection id, or a synthetic negative one keyed by
    bgg_id when unavailable (HTML-scrape fallback, which can't tell distinct
    owned items sharing one bgg_id apart) — matching the pre-collection-id
    behavior for that degraded path."""
    return (
        bgg_game.collection_id
        if bgg_game.collection_id is not None
        else -bgg_game.bgg_id
    )


class ImportGamesUseCase:
    def __init__(
        self,
        game_repo: GameRepository,
        bgg_client: BggClient,
        loan_repo: LoanRepository,
    ) -> None:
        self._game_repo = game_repo
        self._bgg_client = bgg_client
        self._loan_repo = loan_repo

    def execute(self) -> ImportResult:
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

        bgg_games = self._bgg_client.fetch_owned_games()
        fetched_ids = frozenset(_resolve_collection_id(g) for g in bgg_games)
        details_by_bgg_id = (
            self._bgg_client.fetch_details(
                list(dict.fromkeys(g.bgg_id for g in bgg_games))
            )
            if bgg_games
            else {}
        )

        created = 0
        updated = 0
        for bgg_game in bgg_games:
            collection_id = _resolve_collection_id(bgg_game)
            existing = self._game_repo.get_by_collection_id(collection_id)
            if existing is None:
                existing = legacy_by_bgg_id.pop(bgg_game.bgg_id, None)
            details = details_by_bgg_id.get(bgg_game.bgg_id)
            _, was_created = self._game_repo.upsert_by_collection_id(
                bgg_collection_id=collection_id,
                bgg_id=bgg_game.bgg_id,
                name=bgg_game.name,
                thumbnail_url=(
                    bgg_game.thumbnail_url
                    or (details.thumbnail_url if details is not None else "")
                    or (existing.thumbnail_url if existing is not None else "")
                ),
                image_url=(
                    bgg_game.image_url
                    or (details.image_url if details is not None else "")
                    or (existing.image_url if existing is not None else "")
                ),
                year_published=bgg_game.year_published,
                min_players=(
                    details.min_players
                    if details is not None
                    else existing.min_players if existing is not None else 0
                ),
                max_players=(
                    details.max_players
                    if details is not None
                    else existing.max_players if existing is not None else 0
                ),
                playing_time=(
                    details.playing_time
                    if details is not None
                    else existing.playing_time if existing is not None else 0
                ),
                bgg_rating=(
                    details.bgg_rating
                    if details is not None
                    else existing.bgg_rating if existing is not None else 0.0
                ),
                location=existing.location if existing is not None else "armari",
                description=(
                    details.description
                    if details is not None
                    else existing.description if existing is not None else ""
                ),
                categories=(
                    details.categories
                    if details is not None
                    else existing.categories if existing is not None else ()
                ),
                publication_types=(
                    existing.publication_types if existing is not None else ()
                ),
            )
            if was_created:
                created += 1
            else:
                updated += 1

        # Any bgg_id remaining in legacy_by_bgg_id after the upsert loop was
        # not adopted by any fetched game, i.e. it's no longer owned on BGG
        # (the loop pops every bgg_id it encounters). Guarded against the
        # rare case of a shared bgg_id already claimed by another row's
        # collection_id by also checking fetched_bgg_ids directly.
        fetched_bgg_ids = frozenset(g.bgg_id for g in bgg_games)
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

        return ImportResult(
            created=created,
            updated=updated,
            total=len(bgg_games),
            deactivated=newly_deactivated + len(blocked_ids) + legacy_deactivated,
            deleted=len(deleted_ids) + legacy_deleted,
            skip_reason=outcome.skip_reason,
        )
