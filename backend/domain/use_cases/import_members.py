from __future__ import annotations

from collections import Counter
from dataclasses import dataclass

from backend.domain.entities.member import Member
from backend.domain.entities.password_token import PasswordToken
from backend.domain.repositories.member_repository import MemberRepository
from backend.domain.repositories.password_token_repository import (
    PasswordTokenRepository,
)


@dataclass(frozen=True)
class ImportResult:
    member: Member
    token_url: str


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

    def execute(self, raw_members: list[dict[str, str]]) -> list[ImportResult]:
        # Filter out members without email
        members_with_email = [m for m in raw_members if m.get("Email", "").strip()]

        # Count nicknames across ALL members in the batch (including those without email,
        # but only non-empty ones matter for uniqueness)
        nickname_counts: Counter[str] = Counter()
        for m in members_with_email:
            nickname = m.get("Apodo", "").strip()
            if nickname:
                nickname_counts[nickname] += 1

        # Track which emails existed before import
        existing_emails: set[str] = set()
        for m in members_with_email:
            email = m["Email"].strip()
            if self._member_repo.get_by_email(email) is not None:
                existing_emails.add(email)

        # Upsert all members
        upserted_members: list[Member] = []
        for m in members_with_email:
            email = m["Email"].strip()
            first_name = m.get("Nombre", "").strip()
            last_name = m.get("Apellidos", "").strip()
            nickname = m.get("Apodo", "").strip() or None
            phone = m.get("Telefóno", "").strip() or None
            member_number_str = m.get("Nº Socio", "").strip()
            member_number = int(member_number_str) if member_number_str else None
            is_admin = m.get("admin", "").strip().lower() == "yes"

            display_name = _compute_display_name(
                first_name, last_name, nickname, nickname_counts
            )

            last_payment = m.get("Última cuota", "").strip() or None
            gender = m.get("Género", "").strip() or None

            member = self._member_repo.upsert_by_email(
                member_number=member_number,
                first_name=first_name,
                last_name=last_name,
                nickname=nickname,
                phone=phone,
                email=email,
                display_name=display_name,
                is_admin=is_admin,
                last_payment=last_payment,
                gender=gender,
            )
            upserted_members.append(member)

        # Recompute ALL display names (including previously existing members)
        # A new import may introduce nickname collisions
        all_members = self._member_repo.list_all()
        all_nickname_counts: Counter[str] = Counter()
        for member in all_members:
            if member.nickname:
                all_nickname_counts[member.nickname] += 1

        for member in all_members:
            correct_display = _compute_display_name(
                member.first_name,
                member.last_name,
                member.nickname,
                all_nickname_counts,
            )
            if member.display_name != correct_display:
                self._member_repo.update_display_name(member.id, correct_display)

        # Generate password tokens for NEW members only
        results: list[ImportResult] = []
        for member in upserted_members:
            if member.email not in existing_emails:
                token: PasswordToken = self._token_repo.create(member.id)
                token_url = f"{self._base_url}/set-password?token={token.token}"
                results.append(ImportResult(member=member, token_url=token_url))

        return results
