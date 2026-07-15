from __future__ import annotations

from dataclasses import dataclass

DEACTIVATION_GUARD_RATIO = 0.5


@dataclass(frozen=True)
class ReconciliationOutcome:
    missing_bgg_ids: frozenset[int]
    skip_reason: str | None


def compute_reconciliation(
    existing_active_bgg_ids: frozenset[int],
    fetched_bgg_ids: frozenset[int],
    item_type: str,
) -> ReconciliationOutcome:
    if not fetched_bgg_ids:
        return ReconciliationOutcome(
            missing_bgg_ids=frozenset(),
            skip_reason=(
                f"BGG fetch for '{item_type}' returned no items; "
                "skipping removal of newly-missing items"
            ),
        )

    missing = existing_active_bgg_ids - fetched_bgg_ids
    if existing_active_bgg_ids and (
        len(missing) / len(existing_active_bgg_ids) > DEACTIVATION_GUARD_RATIO
    ):
        return ReconciliationOutcome(
            missing_bgg_ids=frozenset(),
            skip_reason=(
                f"{len(missing)} of {len(existing_active_bgg_ids)} active "
                f"'{item_type}' items are missing from the BGG fetch "
                f"(> {DEACTIVATION_GUARD_RATIO:.0%}); skipping removal of "
                "newly-missing items"
            ),
        )

    return ReconciliationOutcome(missing_bgg_ids=missing, skip_reason=None)
