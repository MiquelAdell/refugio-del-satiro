from __future__ import annotations

from collections.abc import Collection
from dataclasses import dataclass

from backend.domain.entities.game import Game
from backend.domain.repositories.game_repository import GameRepository
from backend.domain.repositories.loan_repository import LoanRepository

DEACTIVATION_GUARD_RATIO = 0.5


@dataclass(frozen=True)
class ReconciliationOutcome:
    missing_ids: frozenset[int]
    skip_reason: str | None


def compute_reconciliation(
    existing_active_ids: frozenset[int],
    fetched_ids: frozenset[int],
    item_type: str,
    *,
    extra_active_count: int = 0,
    extra_missing_count: int = 0,
) -> ReconciliationOutcome:
    """Diff by BGG collection entry id (bgg_collection_id), not bgg_id/objectid.

    ``existing_active_ids`` should only include rows that already carry a
    collection_id — legacy rows (imported before collection-id identity
    existed) are excluded until an import run adopts one for them. This
    means the first run after adopting collection-id identity naturally
    treats "nothing is missing yet" rather than wrongly flagging every
    not-yet-adopted row as gone.

    ``extra_active_count``/``extra_missing_count`` let callers fold legacy
    (collection_id-less) rows into the same guard-ratio accounting as
    collection-id rows, without mixing their identifiers into
    ``existing_active_ids``/``fetched_ids`` (legacy rows are matched by
    bgg_id, a different identifier space).
    """
    if not fetched_ids:
        return ReconciliationOutcome(
            missing_ids=frozenset(),
            skip_reason=(
                f"BGG fetch for '{item_type}' returned no items; "
                "skipping removal of newly-missing items"
            ),
        )

    missing = existing_active_ids - fetched_ids
    total_active = len(existing_active_ids) + extra_active_count
    total_missing = len(missing) + extra_missing_count
    if total_active and (total_missing / total_active > DEACTIVATION_GUARD_RATIO):
        return ReconciliationOutcome(
            missing_ids=frozenset(),
            skip_reason=(
                f"{total_missing} of {total_active} active "
                f"'{item_type}' items are missing from the BGG fetch "
                f"(> {DEACTIVATION_GUARD_RATIO:.0%}); skipping removal of "
                "newly-missing items"
            ),
        )

    return ReconciliationOutcome(missing_ids=missing, skip_reason=None)


def resolve_legacy_removals(
    stale_legacy_games: Collection[Game],
    game_repo: GameRepository,
    loan_repo: LoanRepository,
) -> tuple[int, int]:
    """Deactivate or delete legacy rows (bgg_collection_id IS NULL) that are
    no longer present in the BGG collection, matching the semantics applied
    to collection-id rows: currently-lent games are deactivated rather than
    deleted, and games with loan history that can't be hard-deleted (FK
    RESTRICT) are deactivated instead. Returns (deactivated, deleted) counts.
    """
    lent_ids = frozenset(
        game.id
        for game in stale_legacy_games
        if loan_repo.get_active_by_game_id(game.id) is not None
    )
    unlent_ids = frozenset(game.id for game in stale_legacy_games) - lent_ids

    newly_deactivated = game_repo.deactivate_by_ids(lent_ids)
    deleted_ids, blocked_ids = game_repo.delete_by_ids(unlent_ids)
    if blocked_ids:
        game_repo.deactivate_by_ids(blocked_ids)

    return newly_deactivated + len(blocked_ids), len(deleted_ids)
