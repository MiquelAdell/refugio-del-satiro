from __future__ import annotations

from backend.data.bgg_client import BggGame, BggGameDetails
from backend.domain.use_cases.import_games import ImportGamesUseCase
from backend.domain.use_cases.import_rpg_items import ImportRpgItemsUseCase
from tests.domain.use_cases.conftest import FakeGameRepository, FakeLoanRepository
from tests.domain.use_cases.test_import_rpg_items import (
    _PF_RPG_ITEM,
    FakeBggClientRpg,
)


class BggGamesClient:
    def __init__(self, games: list[BggGame]) -> None:
        self._games = games

    def fetch_owned_games(self) -> list[BggGame]:
        return self._games

    def fetch_details(
        self, bgg_ids: list[int], batch_size: int = 20
    ) -> dict[int, BggGameDetails]:
        return {}


class TestItemTypeScoping:
    def test_boardgame_import_never_touches_rpgitem(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_bgg_id(
            1001, "D&D PHB", "https://dnd.jpg", item_type="rpgitem"
        )
        bgg_client = BggGamesClient([])

        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        use_case.execute()

        rpg_item = fake_game_repo.get_by_bgg_id(1001)
        assert rpg_item is not None
        assert rpg_item.is_active is True

    def test_rpgitem_import_never_touches_boardgame(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_bgg_id(
            13, "Catan", "https://c.jpg", item_type="boardgame"
        )
        bgg_client = FakeBggClientRpg([_PF_RPG_ITEM])

        use_case = ImportRpgItemsUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        use_case.execute()

        catan = fake_game_repo.get_by_bgg_id(13)
        assert catan is not None
        assert catan.is_active is True
