from __future__ import annotations

from collections import Counter
from dataclasses import dataclass

from backend.domain.entities.member import Member
from backend.domain.entities.password_token import PasswordToken
from backend.domain.repositories.member_repository import MemberRepository
from backend.domain.repositories.password_token_repository import (
    PasswordTokenRepository,
)
from backend.domain.use_cases.member_reconciliation import (
    compute_member_reconciliation,
)


@dataclass(frozen=True)
class ImportResult:
    member: Member
    token_url: str


@dataclass(frozen=True)
class ImportMembersBatchResult:
    created: tuple[ImportResult, ...]
    created_count: int
    updated_count: int
    skipped_count: int
    disabled_count: int
    total_rows: int
    deactivation_skip_reason: str | None


@dataclass(frozen=True)
class _ValidatedMember:
    member_number: int | None
    first_name: str
    last_name: str
    nickname: str | None
    phone: str | None
    email: str
    is_admin: bool
    last_payment: str | None
    gender: str | None
    is_active: bool


class MemberImportValidationError(ValueError):
    """Raised when a member import row cannot be validated."""


def _validate_member(raw_member: dict[str, str], row_number: int) -> _ValidatedMember:
    member_number_value = raw_member.get("Nº Socio", "").strip()
    try:
        member_number = int(member_number_value) if member_number_value else None
    except ValueError as exc:
        raise MemberImportValidationError(
            f"Invalid member number on row {row_number}: {member_number_value!r}"
        ) from exc

    paid_status = raw_member.get("Pagada", "").strip().lower()
    return _ValidatedMember(
        member_number=member_number,
        first_name=raw_member.get("Nombre", "").strip(),
        last_name=raw_member.get("Apellidos", "").strip(),
        nickname=raw_member.get("Apodo", "").strip() or None,
        phone=raw_member.get("Telefóno", "").strip() or None,
        email=raw_member["Email"].strip(),
        is_admin=raw_member.get("admin", "").strip().lower() == "yes",
        last_payment=raw_member.get("Última cuota", "").strip() or None,
        gender=raw_member.get("Género", "").strip() or None,
        is_active=paid_status != "no",
    )


def _compute_display_name(
    first_name: str,
    last_name: str,
    nickname: str | None,
    nickname_counts: Counter[str],
) -> str:
    """Return nickname if present and unique across all members, else 'Nombre Apellidos'."""
    if nickname and nickname_counts[nickname] == 1:
        return nickname
    return f"{first_name} {last_name}"


class ImportMembersUseCase:
    def __init__(
        self,
        member_repo: MemberRepository,
        token_repo: PasswordTokenRepository,
        base_url: str,
    ) -> None:
        self._member_repo = member_repo
        self._token_repo = token_repo
        self._base_url = base_url.rstrip("/")

    def execute(
        self,
        raw_members: list[dict[str, str]],
        acting_member_id: int | None = None,
    ) -> ImportMembersBatchResult:
        members_with_email = [
            (row_number, member)
            for row_number, member in enumerate(raw_members, start=1)
            if member.get("Email", "").strip()
        ]
        validated_members = tuple(
            _validate_member(member, row_number)
            for row_number, member in members_with_email
        )

        existing_members = tuple(self._member_repo.list_all())
        existing_emails = frozenset(member.email for member in existing_members)
        uploaded_emails = frozenset(member.email for member in validated_members)

        # Count nicknames across ALL members in the batch (including those without email,
        # but only non-empty ones matter for uniqueness)
        nickname_counts = Counter(
            member.nickname
            for member in validated_members
            if member.nickname is not None
        )

        # Upsert all members
        upserted_members: list[Member] = []
        for member_data in validated_members:
            display_name = _compute_display_name(
                member_data.first_name,
                member_data.last_name,
                member_data.nickname,
                nickname_counts,
            )
            member = self._member_repo.upsert_by_email(
                member_number=member_data.member_number,
                first_name=member_data.first_name,
                last_name=member_data.last_name,
                nickname=member_data.nickname,
                phone=member_data.phone,
                email=member_data.email,
                display_name=display_name,
                is_admin=member_data.is_admin,
                last_payment=member_data.last_payment,
                gender=member_data.gender,
                is_active=member_data.is_active,
            )
            upserted_members.append(member)

        # Recompute ALL display names (including previously existing members)
        # A new import may introduce nickname collisions
        all_members = self._member_repo.list_all()
        all_nickname_counts = Counter(
            member.nickname for member in all_members if member.nickname
        )

        for member in all_members:
            correct_display = _compute_display_name(
                member.first_name,
                member.last_name,
                member.nickname,
                all_nickname_counts,
            )
            if member.display_name != correct_display:
                self._member_repo.update_display_name(member.id, correct_display)

        reconciliation = compute_member_reconciliation(
            existing_members,
            uploaded_emails,
            acting_member_id,
        )
        for member_id in reconciliation.missing_member_ids:
            self._member_repo.set_active(member_id, False)

        # Belt-and-braces: preserve both access and activity for the importer.
        if acting_member_id is not None:
            self._member_repo.set_admin(acting_member_id, True)
            self._member_repo.set_active(acting_member_id, True)

        # Generate password tokens for NEW members only
        results: list[ImportResult] = []
        for member in upserted_members:
            if member.email not in existing_emails:
                token: PasswordToken = self._token_repo.create(member.id)
                token_url = f"{self._base_url}/set-password?token={token.token}"
                results.append(ImportResult(member=member, token_url=token_url))

        created_count = sum(
            member.email not in existing_emails for member in validated_members
        )
        return ImportMembersBatchResult(
            created=tuple(results),
            created_count=created_count,
            updated_count=len(validated_members) - created_count,
            skipped_count=len(raw_members) - len(validated_members),
            disabled_count=len(reconciliation.missing_member_ids),
            total_rows=len(raw_members),
            deactivation_skip_reason=reconciliation.skip_reason,
        )
