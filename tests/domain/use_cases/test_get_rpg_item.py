from __future__ import annotations

from backend.domain.use_cases.get_rpg_item import GetRpgItemUseCase
from tests.domain.use_cases.test_list_games import FakeGameRepository
from tests.domain.use_cases.test_list_rpg_items import (
    _make_boardgame,
    _make_rpg_item,
)


class TestGetRpgItemUseCase:
    def test_returns_none_when_slug_missing(self) -> None:
        use_case = GetRpgItemUseCase(game_repo=FakeGameRepository())

        assert use_case.execute("no-existe") is None

    def test_returns_none_for_boardgame_slug(self) -> None:
        boardgame = _make_boardgame(1, "Catan")
        use_case = GetRpgItemUseCase(game_repo=FakeGameRepository([boardgame]))

        assert use_case.execute("catan") is None

    def test_returns_rpg_item_by_slug(self) -> None:
        rpg = _make_rpg_item(1, "Pathfinder")
        use_case = GetRpgItemUseCase(game_repo=FakeGameRepository([rpg]))

        result = use_case.execute("pathfinder")

        assert result is not None
        assert result.id == 1
        assert result.name == "Pathfinder"
        assert result.item_type == "rpgitem"
        assert result.description == "A great RPG book."
