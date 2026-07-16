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
    collection_id=2001,
    categories=("Adventure", "Fantasy"),
    publication_types=("Core Rules",),
    details_loaded=True,
)
_PF_RPG_ITEM = BggRpgItem(
    bgg_id=1002,
    name="Pathfinder Core Rulebook",
    thumbnail_url="https://cf.geekdo-images.com/pf_t.png",
    image_url="https://cf.geekdo-images.com/pf.png",
    year_published=2019,
    bgg_rating=9.1,
    description="The complete Pathfinder rules.",
    collection_id=2002,
    categories=("Fantasy",),
    publication_types=("Core Rules",),
    details_loaded=True,
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

        game = fake_game_repo.get_by_collection_id(2001)
        assert game is not None
        assert game.item_type == "rpgitem"

    def test_upserts_description(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        bgg_client = FakeBggClientRpg([_DND_RPG_ITEM])
        use_case = ImportRpgItemsUseCase(fake_game_repo, bgg_client, fake_loan_repo)

        use_case.execute()

        game = fake_game_repo.get_by_collection_id(2001)
        assert game is not None
        assert game.description == "A guide for adventurers."
        assert game.categories == ("Adventure", "Fantasy")
        assert game.publication_types == ("Core Rules",)

    def test_successful_details_overwrite_existing_metadata(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_bgg_id(
            1001,
            "Old D&D",
            "https://old-thumb.jpg",
            image_url="https://old-full.jpg",
            year_published=2000,
            bgg_rating=5.0,
            location="prestatge",
            item_type="rpgitem",
            description="Old description",
            categories=("Old genre",),
            publication_types=("Old type",),
        )
        changed = BggRpgItem(
            bgg_id=1001,
            name="New D&D",
            thumbnail_url="https://new-thumb.jpg",
            image_url="",
            year_published=2014,
            bgg_rating=8.5,
            description="",
            categories=(),
            publication_types=(),
            details_loaded=True,
        )

        ImportRpgItemsUseCase(
            fake_game_repo, FakeBggClientRpg([changed]), fake_loan_repo
        ).execute()

        game = fake_game_repo.get_by_bgg_id(1001)
        assert game is not None
        assert game.name == "New D&D"
        assert game.thumbnail_url == "https://new-thumb.jpg"
        assert game.year_published == 2014
        assert game.image_url == "https://old-full.jpg"
        assert game.bgg_rating == 8.5
        assert game.location == "prestatge"
        assert game.description == ""
        assert game.categories == ()
        assert game.publication_types == ()

    def test_missing_details_preserve_existing_detail_metadata(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_bgg_id(
            1001,
            "Old D&D",
            "https://old-thumb.jpg",
            image_url="https://old-full.jpg",
            year_published=2000,
            bgg_rating=8.0,
            location="prestatge",
            item_type="rpgitem",
            description="Stored description",
            categories=("Stored genre",),
            publication_types=("Stored type",),
        )
        missing_details = BggRpgItem(
            bgg_id=1001,
            name="New D&D",
            thumbnail_url="https://new-thumb.jpg",
            image_url="",
            year_published=2014,
            bgg_rating=0.0,
            description="",
            details_loaded=False,
        )

        ImportRpgItemsUseCase(
            fake_game_repo,
            FakeBggClientRpg([missing_details, _PF_RPG_ITEM]),
            fake_loan_repo,
        ).execute()

        game = fake_game_repo.get_by_bgg_id(1001)
        assert game is not None
        assert game.name == "New D&D"
        assert game.thumbnail_url == "https://new-thumb.jpg"
        assert game.year_published == 2014
        assert game.image_url == "https://old-full.jpg"
        assert game.bgg_rating == 8.0
        assert game.location == "prestatge"
        assert game.description == "Stored description"
        assert game.categories == ("Stored genre",)
        assert game.publication_types == ("Stored type",)
        successful_item = fake_game_repo.get_by_bgg_id(1002)
        assert successful_item is not None
        assert successful_item.description == "The complete Pathfinder rules."
        assert successful_item.categories == ("Fantasy",)
        assert successful_item.publication_types == ("Core Rules",)

    def test_updates_existing_rpg_item(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_collection_id(
            2001, 1001, "D&D PHB", "https://old.jpg", item_type="rpgitem"
        )
        bgg_client = FakeBggClientRpg([_DND_RPG_ITEM])
        use_case = ImportRpgItemsUseCase(fake_game_repo, bgg_client, fake_loan_repo)

        result = use_case.execute()

        assert result.created == 0
        assert result.updated == 1
        game = fake_game_repo.get_by_collection_id(2001)
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
        fake_game_repo.upsert_by_collection_id(
            2001, 1001, "D&D PHB", "https://old.jpg", item_type="rpgitem"
        )
        fake_game_repo.upsert_by_collection_id(
            2002, 1002, "Pathfinder", "https://pf.jpg", item_type="rpgitem"
        )
        bgg_client = FakeBggClientRpg([_PF_RPG_ITEM])

        use_case = ImportRpgItemsUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deleted == 1
        assert fake_game_repo.get_by_collection_id(2001) is None

    def test_missing_and_currently_lent_is_soft_deleted(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        game, _ = fake_game_repo.upsert_by_collection_id(
            2001, 1001, "D&D PHB", "https://old.jpg", item_type="rpgitem"
        )
        fake_game_repo.upsert_by_collection_id(
            2002, 1002, "Pathfinder", "https://pf.jpg", item_type="rpgitem"
        )
        fake_loan_repo.set_active_loan(game.id, _loan(game.id))
        bgg_client = FakeBggClientRpg([_PF_RPG_ITEM])

        use_case = ImportRpgItemsUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deactivated == 1
        assert result.deleted == 0
        stored = fake_game_repo.get_by_collection_id(2001)
        assert stored is not None
        assert stored.is_active is False

    def test_item_type_scoping_ignores_boardgames(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        """An RPG import must never delete/deactivate a boardgame."""
        fake_game_repo.upsert_by_collection_id(
            1013, 13, "Catan", "https://c.jpg", item_type="boardgame"
        )
        bgg_client = FakeBggClientRpg([])

        use_case = ImportRpgItemsUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        use_case.execute()

        catan = fake_game_repo.get_by_collection_id(1013)
        assert catan is not None
        assert catan.is_active is True

    def test_bgg_id_shared_by_distinct_items_creates_separate_rows(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        bgg_client = FakeBggClientRpg(
            [
                BggRpgItem(
                    bgg_id=5000,
                    name="Variant A",
                    thumbnail_url="a_t.jpg",
                    image_url="a.jpg",
                    year_published=2020,
                    bgg_rating=7.0,
                    description="",
                    collection_id=9001,
                    categories=("Fantasy",),
                    publication_types=("Core Rules",),
                ),
                BggRpgItem(
                    bgg_id=5000,
                    name="Variant B",
                    thumbnail_url="b_t.jpg",
                    image_url="b.jpg",
                    year_published=2020,
                    bgg_rating=7.0,
                    description="",
                    collection_id=9002,
                    categories=("Fantasy",),
                    publication_types=("Core Rules",),
                ),
            ]
        )
        use_case = ImportRpgItemsUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.created == 2
        stored = fake_game_repo.list_all()
        assert len(stored) == 2
        assert {item.image_url for item in stored} == {"a.jpg", "b.jpg"}
        assert {item.categories for item in stored} == {("Fantasy",)}
        assert {item.publication_types for item in stored} == {("Core Rules",)}


class TestLegacyRowRemoval:
    """Legacy rows (bgg_collection_id IS NULL) that fall out of the BGG
    collection must be reconciled the same way collection-id rows are —
    they must not be silently kept forever. Each test keeps enough
    surviving collection-id items in the fetch so the combined (collection
    + legacy) missing ratio stays under the 50% guard."""

    def _surviving_items(self) -> list[BggRpgItem]:
        return [_DND_RPG_ITEM, _PF_RPG_ITEM]

    def _seed_surviving_items(self, fake_game_repo: FakeGameRepository) -> None:
        fake_game_repo.upsert_by_collection_id(
            2001, 1001, "D&D PHB", "https://old.jpg", item_type="rpgitem"
        )
        fake_game_repo.upsert_by_collection_id(
            2002, 1002, "Pathfinder", "https://pf.jpg", item_type="rpgitem"
        )

    def test_active_legacy_row_absent_from_fetch_is_deleted(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        self._seed_surviving_items(fake_game_repo)
        legacy = fake_game_repo.upsert_by_bgg_id(
            2005,
            "Call of Cthulhu Keeper Rulebook",
            "https://coc.jpg",
            item_type="rpgitem",
        )
        assert legacy.bgg_collection_id is None
        bgg_client = FakeBggClientRpg(self._surviving_items())

        use_case = ImportRpgItemsUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deleted == 1
        assert result.deactivated == 0
        assert result.skip_reason is None
        assert fake_game_repo.get_by_bgg_id(2005) is None
        assert {g.bgg_id for g in fake_game_repo.list_all()} == {1001, 1002}

    def test_active_legacy_row_absent_from_fetch_but_lent_is_deactivated(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        self._seed_surviving_items(fake_game_repo)
        legacy = fake_game_repo.upsert_by_bgg_id(
            2005,
            "Call of Cthulhu Keeper Rulebook",
            "https://coc.jpg",
            item_type="rpgitem",
        )
        fake_loan_repo.set_active_loan(legacy.id, _loan(legacy.id))
        bgg_client = FakeBggClientRpg(self._surviving_items())

        use_case = ImportRpgItemsUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deleted == 0
        assert result.deactivated == 1
        assert result.skip_reason is None
        stored = fake_game_repo.get_by_bgg_id(2005)
        assert stored is not None
        assert stored.is_active is False

    def test_legacy_row_still_in_fetch_is_adopted_not_removed(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        self._seed_surviving_items(fake_game_repo)
        legacy = fake_game_repo.upsert_by_bgg_id(
            2005,
            "Call of Cthulhu Keeper Rulebook",
            "https://coc.jpg",
            item_type="rpgitem",
        )
        adopted_item = BggRpgItem(
            bgg_id=2005,
            name="Call of Cthulhu Keeper Rulebook",
            thumbnail_url="https://coc.jpg",
            image_url="",
            year_published=2019,
            bgg_rating=8.0,
            description="",
            collection_id=2905,
        )
        bgg_client = FakeBggClientRpg([*self._surviving_items(), adopted_item])

        use_case = ImportRpgItemsUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deleted == 0
        assert result.deactivated == 0
        assert result.updated == 3
        assert result.skip_reason is None
        adopted = fake_game_repo.get_by_collection_id(2905)
        assert adopted is not None
        assert adopted.id == legacy.id
        assert adopted.is_active is True

    def test_empty_fetch_leaves_legacy_rows_untouched(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        legacy = fake_game_repo.upsert_by_bgg_id(
            2005,
            "Call of Cthulhu Keeper Rulebook",
            "https://coc.jpg",
            item_type="rpgitem",
        )
        bgg_client = FakeBggClientRpg([])

        use_case = ImportRpgItemsUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deleted == 0
        assert result.deactivated == 0
        assert result.skip_reason is not None
        stored = fake_game_repo.get_by_bgg_id(2005)
        assert stored is not None
        assert stored.id == legacy.id
        assert stored.is_active is True
