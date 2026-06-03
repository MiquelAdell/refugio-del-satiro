from __future__ import annotations

from datetime import UTC, datetime

from backend.api.auth import hash_password
from backend.domain.entities.member import Member
from backend.domain.repositories.member_repository import MemberRepository
from backend.domain.repositories.password_token_repository import (
    PasswordTokenRepository,
)


class SetPasswordError(Exception):
    pass


class SetPasswordUseCase:
    def __init__(
        self,
        member_repo: MemberRepository,
        token_repo: PasswordTokenRepository,
    ) -> None:
        self._member_repo = member_repo
        self._token_repo = token_repo

    def execute(self, token: str, password: str) -> Member:
        """Set a member's password using a one-time token. Raises SetPasswordError on failure."""
        password_token = self._token_repo.get_by_token(token)
        if password_token is None:
            raise SetPasswordError("Token invàlid.")

        if password_token.used_at is not None:
            raise SetPasswordError("Aquest enllaç ja ha estat utilitzat.")

        if datetime.now(UTC) > password_token.expires_at.replace(tzinfo=UTC):
            raise SetPasswordError("Aquest enllaç ha caducat.")

        hashed = hash_password(password)
        self._member_repo.set_password_hash(password_token.member_id, hashed)
        self._token_repo.mark_used(password_token.id)

        member = self._member_repo.get_by_id(password_token.member_id)
        assert member is not None
        return member
