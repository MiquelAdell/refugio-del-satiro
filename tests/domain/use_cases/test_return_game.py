from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import MagicMock

import pytest

from backend.data.repositories.sqlite_game_repository import SqliteGameRepository
from backend.data.repositories.sqlite_loan_repository import SqliteLoanRepository
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
from backend.domain.entities.member import Member
from backend.domain.use_cases.return_game import ReturnGameError, ReturnGameUseCase


class FakeNotifier:
    def __init__(self, result: bool = True, error: Exception | None = None) -> None:
        self.result = result
        self.error = error
        self.calls: list[tuple[str, str, str]] = []

    def send_forced_return(
        self, to_email: str, display_name: str, item_name: str
    ) -> bool:
        self.calls.append((to_email, display_name, item_name))
        if self.error is not None:
            raise self.error
        return self.result


def _make_member(*, id: int, is_admin: bool = False) -> Member:
    now = datetime.now(UTC)
    return Member(
        id=id,
        member_number=id,
        first_name="Test",
        last_name="User",
        nickname=None,
        phone=None,
        email=f"user{id}@test.com",
        display_name=f"User {id}",
        password_hash=None,
        is_admin=is_admin,
        is_active=True,
        created_at=now,
        updated_at=now,
    )


class TestReturnGameUseCase:
    def test_borrower_can_return(
        self,
        game_repo: SqliteGameRepository,
        loan_repo: SqliteLoanRepository,
        member_repo: SqliteMemberRepository,
    ) -> None:
        game = game_repo.upsert_by_bgg_id(1, "Catan", "https://c.jpg", 1995)
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )
        loan = loan_repo.create(game.id, member.id)

        notifier = FakeNotifier()
        use_case = ReturnGameUseCase(loan_repo, member_repo, game_repo, notifier)
        result = use_case.execute(loan.id, _make_member(id=member.id))
        assert result.loan.returned_at is not None
        assert result.forced_return_email_sent is None
        assert notifier.calls == []

    def test_admin_returning_own_loan_does_not_notify(
        self,
        game_repo: SqliteGameRepository,
        loan_repo: SqliteLoanRepository,
        member_repo: SqliteMemberRepository,
    ) -> None:
        game = game_repo.upsert_by_bgg_id(1, "Catan", "https://c.jpg", 1995)
        admin = member_repo.upsert_by_email(
            1, "Admin", "User", None, None, "admin@example.invalid", "Admin", True
        )
        loan = loan_repo.create(game.id, admin.id)
        notifier = FakeNotifier()

        result = ReturnGameUseCase(loan_repo, member_repo, game_repo, notifier).execute(
            loan.id, admin
        )

        assert result.loan.returned_at is not None
        assert result.forced_return_email_sent is None
        assert notifier.calls == []

    def test_other_member_cannot_return(
        self,
        game_repo: SqliteGameRepository,
        loan_repo: SqliteLoanRepository,
        member_repo: SqliteMemberRepository,
    ) -> None:
        game = game_repo.upsert_by_bgg_id(1, "Catan", "https://c.jpg", 1995)
        m1 = member_repo.upsert_by_email(
            1, "A", "User", None, None, "TEST_email@domain.com", "A User", False
        )
        member_repo.upsert_by_email(
            2, "B", "User", None, None, "TEST_email@domain.com", "B User", False
        )
        loan = loan_repo.create(game.id, m1.id)

        use_case = ReturnGameUseCase(loan_repo, member_repo, game_repo, FakeNotifier())
        with pytest.raises(ReturnGameError, match="Solo puedes devolver"):
            use_case.execute(loan.id, _make_member(id=2))

    def test_admin_can_return_any(
        self,
        game_repo: SqliteGameRepository,
        loan_repo: SqliteLoanRepository,
        member_repo: SqliteMemberRepository,
    ) -> None:
        game = game_repo.upsert_by_bgg_id(1, "Catan", "https://c.jpg", 1995)
        m1 = member_repo.upsert_by_email(
            1, "A", "User", None, None, "TEST_email@domain.com", "A User", False
        )
        member_repo.upsert_by_email(
            2, "Admin", "User", None, None, "admin@example.invalid", "Admin", True
        )
        loan = loan_repo.create(game.id, m1.id)

        notifier = FakeNotifier()
        use_case = ReturnGameUseCase(loan_repo, member_repo, game_repo, notifier)
        result = use_case.execute(loan.id, _make_member(id=2, is_admin=True))
        assert result.loan.returned_at is not None
        assert result.forced_return_email_sent is True
        assert notifier.calls == [("TEST_email@domain.com", "A User", "Catan")]

    @pytest.mark.parametrize(
        ("notifier", "expected_calls"),
        [
            (FakeNotifier(result=False), 1),
            (FakeNotifier(error=OSError("SMTP unavailable")), 1),
        ],
    )
    def test_forced_return_is_persisted_when_notification_fails(
        self,
        notifier: FakeNotifier,
        expected_calls: int,
        game_repo: SqliteGameRepository,
        loan_repo: SqliteLoanRepository,
        member_repo: SqliteMemberRepository,
    ) -> None:
        game = game_repo.upsert_by_bgg_id(1, "Catan", "https://c.jpg", 1995)
        borrower = member_repo.upsert_by_email(
            1, "A", "User", None, None, "a@example.invalid", "A User", False
        )
        admin = member_repo.upsert_by_email(
            2, "Admin", "User", None, None, "admin@example.invalid", "Admin", True
        )
        loan = loan_repo.create(game.id, borrower.id)

        result = ReturnGameUseCase(loan_repo, member_repo, game_repo, notifier).execute(
            loan.id, admin
        )

        assert result.forced_return_email_sent is False
        assert loan_repo.get_by_id(loan.id) == result.loan
        assert result.loan.returned_at is not None
        assert len(notifier.calls) == expected_calls

    def test_forced_return_with_missing_notification_data_is_persisted(
        self,
        game_repo: SqliteGameRepository,
        loan_repo: SqliteLoanRepository,
        member_repo: SqliteMemberRepository,
    ) -> None:
        game = game_repo.upsert_by_bgg_id(1, "Catan", "https://c.jpg", 1995)
        borrower = member_repo.upsert_by_email(
            1, "A", "User", None, None, "a@example.invalid", "A User", False
        )
        admin = member_repo.upsert_by_email(
            2, "Admin", "User", None, None, "admin@example.invalid", "Admin", True
        )
        loan = loan_repo.create(game.id, borrower.id)
        missing_game_repo = MagicMock()
        missing_game_repo.get_by_id.return_value = None
        notifier = FakeNotifier()

        result = ReturnGameUseCase(
            loan_repo, member_repo, missing_game_repo, notifier
        ).execute(loan.id, admin)

        assert result.loan.returned_at is not None
        assert result.forced_return_email_sent is False
        assert notifier.calls == []

    @pytest.mark.parametrize("failing_lookup", ["member", "game"])
    def test_forced_return_is_persisted_when_notification_lookup_raises(
        self,
        failing_lookup: str,
        game_repo: SqliteGameRepository,
        loan_repo: SqliteLoanRepository,
        member_repo: SqliteMemberRepository,
    ) -> None:
        game = game_repo.upsert_by_bgg_id(1, "Catan", "https://c.jpg", 1995)
        borrower = member_repo.upsert_by_email(
            1, "A", "User", None, None, "a@example.invalid", "A User", False
        )
        admin = member_repo.upsert_by_email(
            2, "Admin", "User", None, None, "admin@example.invalid", "Admin", True
        )
        loan = loan_repo.create(game.id, borrower.id)
        failing_member_repo = MagicMock(wraps=member_repo)
        failing_game_repo = MagicMock(wraps=game_repo)
        if failing_lookup == "member":
            failing_member_repo.get_by_id.side_effect = RuntimeError("member lookup")
        else:
            failing_game_repo.get_by_id.side_effect = RuntimeError("game lookup")
        notifier = FakeNotifier()

        result = ReturnGameUseCase(
            loan_repo,
            failing_member_repo,
            failing_game_repo,
            notifier,
        ).execute(loan.id, admin)

        persisted = loan_repo.get_by_id(loan.id)
        assert persisted == result.loan
        assert persisted is not None
        assert persisted.returned_at is not None
        assert result.forced_return_email_sent is False
        assert notifier.calls == []

    def test_cannot_return_already_returned(
        self,
        game_repo: SqliteGameRepository,
        loan_repo: SqliteLoanRepository,
        member_repo: SqliteMemberRepository,
    ) -> None:
        game = game_repo.upsert_by_bgg_id(1, "Catan", "https://c.jpg", 1995)
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )
        loan = loan_repo.create(game.id, member.id)
        loan_repo.mark_returned(loan.id)

        notifier = FakeNotifier()
        use_case = ReturnGameUseCase(loan_repo, member_repo, game_repo, notifier)
        with pytest.raises(ReturnGameError, match="ya ha sido devuelto"):
            use_case.execute(loan.id, _make_member(id=member.id))
        assert notifier.calls == []
