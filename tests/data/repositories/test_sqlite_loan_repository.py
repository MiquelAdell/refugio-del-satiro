import sqlite3

import pytest

from backend.data.repositories.sqlite_game_repository import SqliteGameRepository
from backend.data.repositories.sqlite_loan_repository import SqliteLoanRepository
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository


@pytest.fixture
def _seed_data(
    game_repo: SqliteGameRepository,
    member_repo: SqliteMemberRepository,
) -> tuple[int, int, int]:
    """Create two games and one member for loan tests. Returns (game1_id, game2_id, member_id)."""
    g1 = game_repo.upsert_by_bgg_id(1, "Catan", "https://c.jpg", 1995)
    g2 = game_repo.upsert_by_bgg_id(2, "Azul", "https://a.jpg", 2017)
    m = member_repo.upsert_by_email(
        1, "Test", "User", None, None, "test@test.com", "Test User", False
    )
    return g1.id, g2.id, m.id


class TestSqliteLoanRepository:
    def test_create_loan(
        self, loan_repo: SqliteLoanRepository, _seed_data: tuple[int, int, int]
    ) -> None:
        game_id, _, member_id = _seed_data
        loan = loan_repo.create(game_id, member_id)
        assert loan.game_id == game_id
        assert loan.member_id == member_id
        assert loan.returned_at is None

    def test_get_active_by_game_id(
        self, loan_repo: SqliteLoanRepository, _seed_data: tuple[int, int, int]
    ) -> None:
        game_id, _, member_id = _seed_data
        loan_repo.create(game_id, member_id)
        active = loan_repo.get_active_by_game_id(game_id)
        assert active is not None
        assert active.game_id == game_id

    def test_no_active_loan(
        self, loan_repo: SqliteLoanRepository, _seed_data: tuple[int, int, int]
    ) -> None:
        game_id, _, _ = _seed_data
        assert loan_repo.get_active_by_game_id(game_id) is None

    def test_mark_returned(
        self, loan_repo: SqliteLoanRepository, _seed_data: tuple[int, int, int]
    ) -> None:
        game_id, _, member_id = _seed_data
        loan = loan_repo.create(game_id, member_id)
        returned = loan_repo.mark_returned(loan.id)
        assert returned.returned_at is not None

    def test_returned_loan_not_active(
        self, loan_repo: SqliteLoanRepository, _seed_data: tuple[int, int, int]
    ) -> None:
        game_id, _, member_id = _seed_data
        loan = loan_repo.create(game_id, member_id)
        loan_repo.mark_returned(loan.id)
        assert loan_repo.get_active_by_game_id(game_id) is None

    def test_list_active_by_member(
        self, loan_repo: SqliteLoanRepository, _seed_data: tuple[int, int, int]
    ) -> None:
        game1_id, game2_id, member_id = _seed_data
        loan_repo.create(game1_id, member_id)
        loan_repo.create(game2_id, member_id)
        active = loan_repo.list_active_by_member_id(member_id)
        assert len(active) == 2

    def test_list_by_game_id_includes_returned(
        self, loan_repo: SqliteLoanRepository, _seed_data: tuple[int, int, int]
    ) -> None:
        game_id, _, member_id = _seed_data
        loan1 = loan_repo.create(game_id, member_id)
        loan_repo.mark_returned(loan1.id)
        loan_repo.create(game_id, member_id)
        history = loan_repo.list_by_game_id(game_id)
        assert len(history) == 2

    def test_unique_active_loan_per_game(
        self,
        loan_repo: SqliteLoanRepository,
        _seed_data: tuple[int, int, int],
        db_conn: sqlite3.Connection,
    ) -> None:
        game_id, _, member_id = _seed_data
        loan_repo.create(game_id, member_id)
        with pytest.raises(sqlite3.IntegrityError):
            db_conn.execute(
                "INSERT INTO loans (game_id, member_id, borrowed_at) VALUES (?, ?, datetime('now'))",
                (game_id, member_id),
            )
