from __future__ import annotations

from dataclasses import dataclass

from backend.domain.entities.member import Member

DEACTIVATION_GUARD_RATIO = 0.5


@dataclass(frozen=True)
class MemberReconciliationOutcome:
    missing_member_ids: frozenset[int]
    skip_reason: str | None


def compute_member_reconciliation(
    existing_members: tuple[Member, ...],
    uploaded_emails: frozenset[str],
    acting_member_id: int | None,
) -> MemberReconciliationOutcome:
    if not uploaded_emails:
        return MemberReconciliationOutcome(
            missing_member_ids=frozenset(),
            skip_reason=(
                "The member import contains no valid email addresses; "
                "skipping deactivation of missing members"
            ),
        )

    existing_active_non_actor = tuple(
        member
        for member in existing_members
        if member.is_active and member.id != acting_member_id
    )
    missing_member_ids = frozenset(
        member.id
        for member in existing_active_non_actor
        if member.email not in uploaded_emails
    )

    if existing_active_non_actor and (
        len(missing_member_ids) / len(existing_active_non_actor)
        > DEACTIVATION_GUARD_RATIO
    ):
        return MemberReconciliationOutcome(
            missing_member_ids=frozenset(),
            skip_reason=(
                f"{len(missing_member_ids)} of "
                f"{len(existing_active_non_actor)} active members are missing "
                f"from the import (> {DEACTIVATION_GUARD_RATIO:.0%}); "
                "skipping deactivation of missing members"
            ),
        )

    return MemberReconciliationOutcome(
        missing_member_ids=missing_member_ids,
        skip_reason=None,
    )
