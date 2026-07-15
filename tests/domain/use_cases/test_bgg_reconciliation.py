from __future__ import annotations

from backend.domain.use_cases.bgg_reconciliation import compute_reconciliation


class TestComputeReconciliation:
    def test_no_missing_ids(self) -> None:
        outcome = compute_reconciliation(
            existing_active_bgg_ids=frozenset({1, 2}),
            fetched_bgg_ids=frozenset({1, 2}),
            item_type="boardgame",
        )
        assert outcome.missing_bgg_ids == frozenset()
        assert outcome.skip_reason is None

    def test_missing_ids_under_guard(self) -> None:
        outcome = compute_reconciliation(
            existing_active_bgg_ids=frozenset({1, 2, 3, 4}),
            fetched_bgg_ids=frozenset({1, 2, 3}),
            item_type="boardgame",
        )
        assert outcome.missing_bgg_ids == frozenset({4})
        assert outcome.skip_reason is None

    def test_empty_fetch_skips(self) -> None:
        outcome = compute_reconciliation(
            existing_active_bgg_ids=frozenset({1, 2}),
            fetched_bgg_ids=frozenset(),
            item_type="boardgame",
        )
        assert outcome.missing_bgg_ids == frozenset()
        assert outcome.skip_reason is not None

    def test_over_50_percent_drop_skips(self) -> None:
        outcome = compute_reconciliation(
            existing_active_bgg_ids=frozenset({1, 2, 3, 4}),
            fetched_bgg_ids=frozenset({1}),
            item_type="boardgame",
        )
        assert outcome.missing_bgg_ids == frozenset()
        assert outcome.skip_reason is not None

    def test_exactly_50_percent_drop_does_not_skip(self) -> None:
        outcome = compute_reconciliation(
            existing_active_bgg_ids=frozenset({1, 2, 3, 4}),
            fetched_bgg_ids=frozenset({1, 2}),
            item_type="boardgame",
        )
        assert outcome.missing_bgg_ids == frozenset({3, 4})
        assert outcome.skip_reason is None

    def test_first_ever_import_does_not_skip_or_divide_by_zero(self) -> None:
        outcome = compute_reconciliation(
            existing_active_bgg_ids=frozenset(),
            fetched_bgg_ids=frozenset({1, 2}),
            item_type="boardgame",
        )
        assert outcome.missing_bgg_ids == frozenset()
        assert outcome.skip_reason is None
