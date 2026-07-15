from __future__ import annotations

import pytest

from backend.data.repositories.sqlite_game_repository import SqliteGameRepository
from backend.data.repositories.sqlite_loan_repository import SqliteLoanRepository
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
from backend.domain.use_cases.borrow_game import BorrowGameError, BorrowGameUseCase
from backend.domain.use_cases.return_game import ReturnGameUseCase


class TestBorrowGameUseCase:
    def test_borrow_available_game(
        self,
        game_repo: SqliteGameRepository,
        loan_repo: SqliteLoanRepository,
        member_repo: SqliteMemberRepository,
    ) -> None:
        game = game_repo.upsert_by_bgg_id(1, "Catan", "https://c.jpg", 1995)
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )
        use_case = BorrowGameUseCase(game_repo, loan_repo)
        loan = use_case.execute(game.id, member.id)
        assert loan.game_id == game.id
        assert loan.member_id == member.id
        assert loan.returned_at is None

    def test_cannot_borrow_already_lent_game(
        self,
        game_repo: SqliteGameRepository,
        loan_repo: SqliteLoanRepository,
        member_repo: SqliteMemberRepository,
    ) -> None:
        game = game_repo.upsert_by_bgg_id(1, "Catan", "https://c.jpg", 1995)
        m1 = member_repo.upsert_by_email(
            1, "A", "User", None, None, "TEST_email@domain.com", "A User", False
        )
        m2 = member_repo.upsert_by_email(
            2, "B", "User", None, None, "TEST_email@domain.com", "B User", False
        )
        use_case = BorrowGameUseCase(game_repo, loan_repo)
        use_case.execute(game.id, m1.id)
        with pytest.raises(BorrowGameError, match="ya está prestado"):
            use_case.execute(game.id, m2.id)

    def test_cannot_borrow_nonexistent_game(
        self,
        game_repo: SqliteGameRepository,
        loan_repo: SqliteLoanRepository,
    ) -> None:
        use_case = BorrowGameUseCase(game_repo, loan_repo)
        with pytest.raises(BorrowGameError, match="no encontrado"):
            use_case.execute(999, 1)

    def test_cannot_borrow_deactivated_game(
        self,
        game_repo: SqliteGameRepository,
        loan_repo: SqliteLoanRepository,
        member_repo: SqliteMemberRepository,
    ) -> None:
        game = game_repo.upsert_by_bgg_id(1, "Catan", "https://c.jpg", 1995)
        game_repo.deactivate_by_bgg_ids([1])
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )
        use_case = BorrowGameUseCase(game_repo, loan_repo)
        with pytest.raises(BorrowGameError, match="no encontrado"):
            use_case.execute(game.id, member.id)

    def test_returning_loan_succeeds_on_deactivated_game(
        self,
        game_repo: SqliteGameRepository,
        loan_repo: SqliteLoanRepository,
        member_repo: SqliteMemberRepository,
    ) -> None:
        game = game_repo.upsert_by_bgg_id(1, "Catan", "https://c.jpg", 1995)
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )
        borrow_use_case = BorrowGameUseCase(game_repo, loan_repo)
        loan = borrow_use_case.execute(game.id, member.id)
        game_repo.deactivate_by_bgg_ids([game.bgg_id])

        return_use_case = ReturnGameUseCase(loan_repo)
        returned = return_use_case.execute(loan.id, member)

        assert returned.returned_at is not None

    def test_borrow_rpg_item_succeeds(
        self,
        game_repo: SqliteGameRepository,
        loan_repo: SqliteLoanRepository,
        member_repo: SqliteMemberRepository,
    ) -> None:
        rpg = game_repo.upsert_by_bgg_id(
            bgg_id=500,
            name="Pathfinder",
            thumbnail_url="https://pf.jpg",
            item_type="rpgitem",
        )
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )
        use_case = BorrowGameUseCase(game_repo, loan_repo)
        loan = use_case.execute(rpg.id, member.id)
        assert loan.game_id == rpg.id
        assert loan.member_id == member.id
        assert loan.returned_at is None
