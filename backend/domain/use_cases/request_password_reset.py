from __future__ import annotations

from backend.config import Settings
from backend.data.email_client import EmailClient
from backend.domain.repositories.member_repository import MemberRepository
from backend.domain.repositories.password_token_repository import (
    PasswordTokenRepository,
)


class RequestPasswordResetUseCase:
    def __init__(
        self,
        member_repo: MemberRepository,
        token_repo: PasswordTokenRepository,
        email_client: EmailClient,
        settings: Settings,
    ) -> None:
        self._member_repo = member_repo
        self._token_repo = token_repo
        self._email_client = email_client
        self._settings = settings

    def execute(self, email: str) -> None:
        """Request a password reset for the given email. Does nothing if email not found or member inactive."""
        member = self._member_repo.get_by_email(email)
        if member is None or not member.is_active:
            return

        token = self._token_repo.create(member.id)
        reset_url = f"{self._settings.base_url}/set-password?token={token.token}"
        self._email_client.send_access_link(
            member.email, member.display_name, reset_url
        )
