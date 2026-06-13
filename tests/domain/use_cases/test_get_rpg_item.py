from __future__ import annotations

from backend.domain.use_cases.get_rpg_item import GetRpgItemUseCase
from tests.domain.use_cases.test_list_games import (
    FakeGameRepository,
    FakeLoanRepository,
    FakeMemberRepository,
    _make_loan,
    _make_member,
)
from tests.domain.use_cases.test_list_rpg_items import (
    _make_boardgame,
    _make_rpg_item,
)


class TestGetRpgItemUseCase:
    def test_returns_none_when_slug_missing(self) -> None:
        use_case = GetRpgItemUseCase(
            game_repo=FakeGameRepository(),
            loan_repo=FakeLoanRepository(),
            member_repo=FakeMemberRepository(),
        )

        assert use_case.execute("no-existe") is None

    def test_returns_none_for_boardgame_slug(self) -> None:
        boardgame = _make_boardgame(1, "Catan")
        use_case = GetRpgItemUseCase(
            game_repo=FakeGameRepository([boardgame]),
            loan_repo=FakeLoanRepository(),
            member_repo=FakeMemberRepository(),
        )

        assert use_case.execute("catan") is None

    def test_returns_rpg_item_by_slug(self) -> None:
        rpg = _make_rpg_item(1, "Pathfinder")
        use_case = GetRpgItemUseCase(
            game_repo=FakeGameRepository([rpg]),
            loan_repo=FakeLoanRepository(),
            member_repo=FakeMemberRepository(),
        )

        result = use_case.execute("pathfinder")

        assert result is not None
        assert result.id == 1
        assert result.name == "Pathfinder"
        assert result.description == "A great RPG book."
        assert result.status == "available"
        assert result.borrower_display_name is None
        assert result.loan_id is None

    def test_lent_rpg_item_exposes_borrower(self) -> None:
        rpg = _make_rpg_item(1, "Shadowrun")
        member = _make_member(10, display_name="Alice")
        loan = _make_loan(100, game_id=1, member_id=10)
        use_case = GetRpgItemUseCase(
            game_repo=FakeGameRepository([rpg]),
            loan_repo=FakeLoanRepository([loan]),
            member_repo=FakeMemberRepository([member]),
        )

        result = use_case.execute("shadowrun")

        assert result is not None
        assert result.status == "lent"
        assert result.borrower_display_name == "Alice"
        assert result.loan_id == 100
