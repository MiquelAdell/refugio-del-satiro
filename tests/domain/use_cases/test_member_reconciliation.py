from __future__ import annotations

from datetime import UTC, datetime

from backend.domain.entities.member import Member
from backend.domain.use_cases.member_reconciliation import (
    compute_member_reconciliation,
)


def _member(member_id: int, email: str, *, is_active: bool = True) -> Member:
    now = datetime.now(UTC)
    return Member(
        id=member_id,
        member_number=member_id,
        first_name=f"Member {member_id}",
        last_name="Test",
        nickname=None,
        phone=None,
        email=email,
        display_name=f"Member {member_id}",
        password_hash=None,
        is_admin=False,
        is_active=is_active,
        created_at=now,
        updated_at=now,
        last_payment=None,
        gender=None,
    )


class TestComputeMemberReconciliation:
    def test_ignores_inactive_members_and_the_acting_member(self) -> None:
        outcome = compute_member_reconciliation(
            (
                _member(1, "present@example.test"),
                _member(2, "actor@example.test"),
                _member(3, "inactive@example.test", is_active=False),
            ),
            frozenset({"present@example.test"}),
            acting_member_id=2,
        )

        assert outcome.missing_member_ids == frozenset()
        assert outcome.skip_reason is None

    def test_returns_missing_ids_at_exactly_half(self) -> None:
        outcome = compute_member_reconciliation(
            (
                _member(1, "present@example.test"),
                _member(2, "missing@example.test"),
            ),
            frozenset({"present@example.test"}),
            acting_member_id=None,
        )

        assert outcome.missing_member_ids == frozenset({2})
        assert outcome.skip_reason is None
