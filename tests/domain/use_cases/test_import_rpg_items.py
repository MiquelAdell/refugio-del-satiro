from __future__ import annotations

from datetime import UTC, datetime

from backend.data.bgg_client import BggRpgItem
from backend.domain.entities.loan import Loan
from backend.domain.use_cases.import_rpg_items import ImportRpgItemsUseCase
from tests.domain.use_cases.conftest import FakeGameRepository, FakeLoanRepository


class FakeBggClientRpg:
    def __init__(self, items: list[BggRpgItem]) -> None:
        self._items = items

    def fetch_owned_rpg_items(self) -> list[BggRpgItem]:
        return self._items


def _loan(game_id: int) -> Loan:
    return Loan(
        id=1,
        game_id=game_id,
        member_id=1,
        borrowed_at=datetime.now(UTC),
        returned_at=None,
    )


_DND_RPG_ITEM = BggRpgItem(
    bgg_id=1001,
    name="Dungeons & Dragons Player's Handbook",
    thumbnail_url="https://cf.geekdo-images.com/dnd_t.png",
    image_url="https://cf.geekdo-images.com/dnd.png",
    year_published=2014,
    bgg_rating=8.5,
    description="A guide for adventurers.",
)
_PF_RPG_ITEM = BggRpgItem(
    bgg_id=1002,
    name="Pathfinder Core Rulebook",
    thumbnail_url="https://cf.geekdo-images.com/pf_t.png",
    image_url="https://cf.geekdo-images.com/pf.png",
    year_published=2019,
    bgg_rating=9.1,
    description="The complete Pathfinder rules.",
)


class TestImportRpgItemsUseCase:
    def test_imports_new_rpg_items(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        bgg_client = FakeBggClientRpg([_DND_RPG_ITEM, _PF_RPG_ITEM])
        use_case = ImportRpgItemsUseCase(fake_game_repo, bgg_client, fake_loan_repo)

        result = use_case.execute()

        assert result.created == 2
        assert result.updated == 0
        assert result.total == 2
        assert len(fake_game_repo.list_all()) == 2

    def test_upserts_with_rpgitem_type(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        bgg_client = FakeBggClientRpg([_DND_RPG_ITEM])
        use_case = ImportRpgItemsUseCase(fake_game_repo, bgg_client, fake_loan_repo)

        use_case.execute()

        game = fake_game_repo.get_by_bgg_id(1001)
        assert game is not None
        assert game.item_type == "rpgitem"

    def test_upserts_description(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        bgg_client = FakeBggClientRpg([_DND_RPG_ITEM])
        use_case = ImportRpgItemsUseCase(fake_game_repo, bgg_client, fake_loan_repo)

        use_case.execute()

        game = fake_game_repo.get_by_bgg_id(1001)
        assert game is not None
        assert game.description == "A guide for adventurers."

    def test_updates_existing_rpg_item(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_bgg_id(
            1001, "D&D PHB", "https://old.jpg", item_type="rpgitem"
        )
        bgg_client = FakeBggClientRpg([_DND_RPG_ITEM])
        use_case = ImportRpgItemsUseCase(fake_game_repo, bgg_client, fake_loan_repo)

        result = use_case.execute()

        assert result.created == 0
        assert result.updated == 1
        game = fake_game_repo.get_by_bgg_id(1001)
        assert game is not None
        assert game.name == "Dungeons & Dragons Player's Handbook"

    def test_empty_collection(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        bgg_client = FakeBggClientRpg([])
        use_case = ImportRpgItemsUseCase(fake_game_repo, bgg_client, fake_loan_repo)

        result = use_case.execute()

        assert result.created == 0
        assert result.updated == 0
        assert result.total == 0
        assert fake_game_repo.list_all() == []
        assert result.skip_reason is not None

    def test_missing_and_not_lent_is_hard_deleted(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_bgg_id(
            1001, "D&D PHB", "https://old.jpg", item_type="rpgitem"
        )
        fake_game_repo.upsert_by_bgg_id(
            1002, "Pathfinder", "https://pf.jpg", item_type="rpgitem"
        )
        bgg_client = FakeBggClientRpg([_PF_RPG_ITEM])

        use_case = ImportRpgItemsUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deleted == 1
        assert fake_game_repo.get_by_bgg_id(1001) is None

    def test_missing_and_currently_lent_is_soft_deleted(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        game = fake_game_repo.upsert_by_bgg_id(
            1001, "D&D PHB", "https://old.jpg", item_type="rpgitem"
        )
        fake_game_repo.upsert_by_bgg_id(
            1002, "Pathfinder", "https://pf.jpg", item_type="rpgitem"
        )
        fake_loan_repo.set_active_loan(game.id, _loan(game.id))
        bgg_client = FakeBggClientRpg([_PF_RPG_ITEM])

        use_case = ImportRpgItemsUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deactivated == 1
        assert result.deleted == 0
        stored = fake_game_repo.get_by_bgg_id(1001)
        assert stored is not None
        assert stored.is_active is False

    def test_item_type_scoping_ignores_boardgames(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        """An RPG import must never delete/deactivate a boardgame."""
        fake_game_repo.upsert_by_bgg_id(
            13, "Catan", "https://c.jpg", item_type="boardgame"
        )
        bgg_client = FakeBggClientRpg([])

        use_case = ImportRpgItemsUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        use_case.execute()

        catan = fake_game_repo.get_by_bgg_id(13)
        assert catan is not None
        assert catan.is_active is True
