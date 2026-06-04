from __future__ import annotations

from backend.domain.use_cases.get_game import GetGameUseCase
from tests.domain.use_cases.test_list_games import (
    FakeGameRepository,
    FakeLoanRepository,
    FakeMemberRepository,
    _make_game,
    _make_loan,
    _make_member,
)


class TestGetGameUseCase:
    def test_returns_none_when_missing(self) -> None:
        use_case = GetGameUseCase(
            game_repo=FakeGameRepository(),
            loan_repo=FakeLoanRepository(),
            member_repo=FakeMemberRepository(),
        )

        assert use_case.execute("no-existe") is None

    def test_returns_available_game(self) -> None:
        game = _make_game(1, "Catan")
        use_case = GetGameUseCase(
            game_repo=FakeGameRepository([game]),
            loan_repo=FakeLoanRepository(),
            member_repo=FakeMemberRepository(),
        )

        result = use_case.execute("catan")

        assert result is not None
        assert result.id == 1
        assert result.name == "Catan"
        assert result.status == "available"
        assert result.borrower_display_name is None
        assert result.loan_id is None

    def test_returns_lent_game(self) -> None:
        game = _make_game(1, "Catan")
        member = _make_member(10, display_name="Bob")
        loan = _make_loan(100, game_id=1, member_id=10)

        use_case = GetGameUseCase(
            game_repo=FakeGameRepository([game]),
            loan_repo=FakeLoanRepository([loan]),
            member_repo=FakeMemberRepository([member]),
        )

        result = use_case.execute("catan")

        assert result is not None
        assert result.status == "lent"
        assert result.borrower_display_name == "Bob"
        assert result.loan_id == 100
