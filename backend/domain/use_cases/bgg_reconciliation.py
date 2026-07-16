from __future__ import annotations

from dataclasses import dataclass

DEACTIVATION_GUARD_RATIO = 0.5


@dataclass(frozen=True)
class ReconciliationOutcome:
    missing_ids: frozenset[int]
    skip_reason: str | None


def compute_reconciliation(
    existing_active_ids: frozenset[int],
    fetched_ids: frozenset[int],
    item_type: str,
) -> ReconciliationOutcome:
    """Diff by BGG collection entry id (bgg_collection_id), not bgg_id/objectid.

    ``existing_active_ids`` should only include rows that already carry a
    collection_id — legacy rows (imported before collection-id identity
    existed) are excluded until an import run adopts one for them. This
    means the first run after adopting collection-id identity naturally
    treats "nothing is missing yet" rather than wrongly flagging every
    not-yet-adopted row as gone.
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
    if existing_active_ids and (
        len(missing) / len(existing_active_ids) > DEACTIVATION_GUARD_RATIO
    ):
        return ReconciliationOutcome(
            missing_ids=frozenset(),
            skip_reason=(
                f"{len(missing)} of {len(existing_active_ids)} active "
                f"'{item_type}' items are missing from the BGG fetch "
                f"(> {DEACTIVATION_GUARD_RATIO:.0%}); skipping removal of "
                "newly-missing items"
            ),
        )

    return ReconciliationOutcome(missing_ids=missing, skip_reason=None)
