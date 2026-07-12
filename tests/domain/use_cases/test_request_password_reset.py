from __future__ import annotations

import sqlite3

from backend.config import Settings
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
from backend.data.repositories.sqlite_password_token_repository import (
    SqlitePasswordTokenRepository,
)
from backend.domain.use_cases.request_password_reset import RequestPasswordResetUseCase


class FakeEmailClient:
    """Captures sent emails for testing."""

    def __init__(self) -> None:
        self.sent: list[tuple[str, str, str]] = []

    def send_access_link(self, to_email: str, display_name: str, url: str) -> bool:
        self.sent.append((to_email, display_name, url))
        return True


class TestRequestPasswordReset:
    def _make_use_case(
        self,
        member_repo: SqliteMemberRepository,
        token_repo: SqlitePasswordTokenRepository,
        email_client: FakeEmailClient | None = None,
    ) -> tuple[RequestPasswordResetUseCase, FakeEmailClient]:
        fake_email = email_client or FakeEmailClient()
        settings = Settings(base_url="https://example.com")
        use_case = RequestPasswordResetUseCase(
            member_repo, token_repo, fake_email, settings  # type: ignore[arg-type]
        )
        return use_case, fake_email

    def test_sends_email_for_active_member(
        self,
        member_repo: SqliteMemberRepository,
        token_repo: SqlitePasswordTokenRepository,
    ) -> None:
        member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )
        use_case, fake_email = self._make_use_case(member_repo, token_repo)

        use_case.execute("TEST_email@domain.com")

        assert len(fake_email.sent) == 1
        to_email, display_name, url = fake_email.sent[0]
        assert to_email == "TEST_email@domain.com"
        assert display_name == "Test User"
        assert url.startswith("https://example.com/set-password?token=")

    def test_creates_password_token(
        self,
        member_repo: SqliteMemberRepository,
        token_repo: SqlitePasswordTokenRepository,
        db_conn: sqlite3.Connection,
    ) -> None:
        member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )
        use_case, _ = self._make_use_case(member_repo, token_repo)

        use_case.execute("TEST_email@domain.com")

        row = db_conn.execute("SELECT COUNT(*) FROM password_tokens").fetchone()
        assert row[0] == 1

    def test_does_nothing_for_nonexistent_email(
        self,
        member_repo: SqliteMemberRepository,
        token_repo: SqlitePasswordTokenRepository,
        db_conn: sqlite3.Connection,
    ) -> None:
        use_case, fake_email = self._make_use_case(member_repo, token_repo)

        use_case.execute("TEST_email@domain.com")

        assert len(fake_email.sent) == 0
        row = db_conn.execute("SELECT COUNT(*) FROM password_tokens").fetchone()
        assert row[0] == 0

    def test_does_nothing_for_inactive_member(
        self,
        member_repo: SqliteMemberRepository,
        token_repo: SqlitePasswordTokenRepository,
        db_conn: sqlite3.Connection,
    ) -> None:
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )
        member_repo.set_active(member.id, False)
        use_case, fake_email = self._make_use_case(member_repo, token_repo)

        use_case.execute("TEST_email@domain.com")

        assert len(fake_email.sent) == 0
        row = db_conn.execute("SELECT COUNT(*) FROM password_tokens").fetchone()
        assert row[0] == 0
