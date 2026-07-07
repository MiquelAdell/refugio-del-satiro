from __future__ import annotations

from datetime import UTC, datetime

import pytest

from backend.data.repositories.sqlite_game_repository import SqliteGameRepository
from backend.data.repositories.sqlite_loan_repository import SqliteLoanRepository
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
from backend.domain.entities.member import Member
from backend.domain.use_cases.return_game import ReturnGameError, ReturnGameUseCase


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
            1, "Test", "User", None, None, "t@t.com", "Test User", False
        )
        loan = loan_repo.create(game.id, member.id)

        use_case = ReturnGameUseCase(loan_repo)
        returned = use_case.execute(loan.id, _make_member(id=member.id))
        assert returned.returned_at is not None

    def test_other_member_cannot_return(
        self,
        game_repo: SqliteGameRepository,
        loan_repo: SqliteLoanRepository,
        member_repo: SqliteMemberRepository,
    ) -> None:
        game = game_repo.upsert_by_bgg_id(1, "Catan", "https://c.jpg", 1995)
        m1 = member_repo.upsert_by_email(
            1, "A", "User", None, None, "a@t.com", "A User", False
        )
        member_repo.upsert_by_email(
            2, "B", "User", None, None, "b@t.com", "B User", False
        )
        loan = loan_repo.create(game.id, m1.id)

        use_case = ReturnGameUseCase(loan_repo)
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
            1, "A", "User", None, None, "a@t.com", "A User", False
        )
        member_repo.upsert_by_email(
            2, "Admin", "User", None, None, "admin@t.com", "Admin", True
        )
        loan = loan_repo.create(game.id, m1.id)

        use_case = ReturnGameUseCase(loan_repo)
        returned = use_case.execute(loan.id, _make_member(id=2, is_admin=True))
        assert returned.returned_at is not None

    def test_cannot_return_already_returned(
        self,
        game_repo: SqliteGameRepository,
        loan_repo: SqliteLoanRepository,
        member_repo: SqliteMemberRepository,
    ) -> None:
        game = game_repo.upsert_by_bgg_id(1, "Catan", "https://c.jpg", 1995)
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "t@t.com", "Test User", False
        )
        loan = loan_repo.create(game.id, member.id)
        loan_repo.mark_returned(loan.id)

        use_case = ReturnGameUseCase(loan_repo)
        with pytest.raises(ReturnGameError, match="ya ha sido devuelto"):
            use_case.execute(loan.id, _make_member(id=member.id))
