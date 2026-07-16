from __future__ import annotations

from datetime import UTC, datetime

from backend.data.bgg_client import BggGame, BggGameDetails
from backend.domain.entities.loan import Loan
from backend.domain.use_cases.import_games import ImportGamesUseCase
from tests.domain.use_cases.conftest import FakeGameRepository, FakeLoanRepository


class FakeBggClient:
    def __init__(
        self,
        games: list[BggGame],
        details: dict[int, BggGameDetails] | None = None,
    ) -> None:
        self._games = games
        self._details = details or {}

    def fetch_owned_games(self) -> list[BggGame]:
        return self._games

    def fetch_details(self, bgg_ids: list[int]) -> dict[int, BggGameDetails]:
        assert bgg_ids == list(dict.fromkeys(game.bgg_id for game in self._games))
        return self._details


def _details(
    *,
    bgg_id: int = 13,
    description: str = "Trade and build.",
    categories: tuple[str, ...] = ("Economic", "Strategy"),
) -> BggGameDetails:
    return BggGameDetails(
        bgg_id=bgg_id,
        image_url="https://full.jpg",
        thumbnail_url="https://detail-thumb.jpg",
        min_players=3,
        max_players=4,
        playing_time=90,
        bgg_rating=7.15,
        description=description,
        categories=categories,
    )


def _loan(game_id: int) -> Loan:
    return Loan(
        id=1,
        game_id=game_id,
        member_id=1,
        borrowed_at=datetime.now(UTC),
        returned_at=None,
    )


class TestImportGamesUseCase:
    def test_imports_complete_boardgame_details(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        bgg_client = FakeBggClient(
            [BggGame(13, "Catan", "https://collection-thumb.jpg", 1995)],
            {13: _details()},
        )

        ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo).execute()

        game = fake_game_repo.get_by_bgg_id(13)
        assert game is not None
        assert game.thumbnail_url == "https://collection-thumb.jpg"
        assert game.image_url == "https://full.jpg"
        assert game.min_players == 3
        assert game.max_players == 4
        assert game.playing_time == 90
        assert game.bgg_rating == 7.15
        assert game.description == "Trade and build."
        assert game.categories == ("Economic", "Strategy")

    def test_missing_collection_thumbnail_uses_detail_then_stored_fallback(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_collection_id(
            1013,
            13,
            "Old Catan",
            "https://stored-thumb.jpg",
            image_url="https://stored-full.jpg",
        )
        bgg_client = FakeBggClient(
            [
                BggGame(13, "Catan", "", 1995, collection_id=1013),
                BggGame(14, "Azul", "", 2017, collection_id=1014),
            ],
            {14: _details(bgg_id=14)},
        )

        ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo).execute()

        catan = fake_game_repo.get_by_collection_id(1013)
        azul = fake_game_repo.get_by_collection_id(1014)
        assert catan is not None
        assert azul is not None
        assert catan.thumbnail_url == "https://stored-thumb.jpg"
        assert azul.thumbnail_url == "https://detail-thumb.jpg"

    def test_successful_details_overwrite_existing_metadata(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_bgg_id(
            13,
            "Old Catan",
            "https://old-thumb.jpg",
            image_url="https://old-full.jpg",
            year_published=1994,
            min_players=2,
            max_players=3,
            playing_time=60,
            bgg_rating=6.0,
            location="prestatge",
            description="Old description",
            categories=("Old category",),
        )
        bgg_client = FakeBggClient(
            [BggGame(13, "Catan", "https://new-thumb.jpg", 1995)],
            {13: _details(description="", categories=())},
        )

        ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo).execute()

        game = fake_game_repo.get_by_bgg_id(13)
        assert game is not None
        assert game.name == "Catan"
        assert game.thumbnail_url == "https://new-thumb.jpg"
        assert game.year_published == 1995
        assert game.image_url == "https://full.jpg"
        assert game.min_players == 3
        assert game.max_players == 4
        assert game.playing_time == 90
        assert game.bgg_rating == 7.15
        assert game.location == "prestatge"
        assert game.description == ""
        assert game.categories == ()

    def test_missing_details_preserve_existing_detail_metadata(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_bgg_id(
            13,
            "Old Catan",
            "https://old-thumb.jpg",
            image_url="https://old-full.jpg",
            year_published=1994,
            min_players=2,
            max_players=5,
            playing_time=75,
            bgg_rating=7.0,
            location="prestatge",
            description="Stored description",
            categories=("Stored category",),
        )
        bgg_client = FakeBggClient(
            [
                BggGame(13, "Catan", "https://new-thumb.jpg", 1995),
                BggGame(14, "Azul", "https://azul-thumb.jpg", 2017),
            ],
            {
                14: _details(
                    bgg_id=14,
                    description="Successful detail",
                    categories=("Abstract",),
                )
            },
        )

        ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo).execute()

        game = fake_game_repo.get_by_bgg_id(13)
        assert game is not None
        assert game.name == "Catan"
        assert game.thumbnail_url == "https://new-thumb.jpg"
        assert game.year_published == 1995
        assert game.image_url == "https://old-full.jpg"
        assert game.min_players == 2
        assert game.max_players == 5
        assert game.playing_time == 75
        assert game.bgg_rating == 7.0
        assert game.location == "prestatge"
        assert game.description == "Stored description"
        assert game.categories == ("Stored category",)
        successful_game = fake_game_repo.get_by_bgg_id(14)
        assert successful_game is not None
        assert successful_game.description == "Successful detail"
        assert successful_game.categories == ("Abstract",)

    def test_imports_new_games(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        bgg_client = FakeBggClient(
            [
                BggGame(13, "Catan", "https://c.jpg", 1995, collection_id=1013),
                BggGame(230802, "Azul", "https://a.jpg", 2017, collection_id=1230802),
            ]
        )
        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()
        assert result.created == 2
        assert result.updated == 0
        assert result.total == 2
        assert len(fake_game_repo.list_all()) == 2

    def test_updates_existing_games(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_collection_id(
            1013, 13, "Catan", "https://old.jpg", 1995
        )
        bgg_client = FakeBggClient(
            [
                BggGame(
                    13,
                    "Catan: 25th Anniversary",
                    "https://new.jpg",
                    1995,
                    collection_id=1013,
                )
            ]
        )
        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()
        assert result.created == 0
        assert result.updated == 1
        game = fake_game_repo.get_by_collection_id(1013)
        assert game is not None
        assert game.name == "Catan: 25th Anniversary"

    def test_mixed_create_and_update(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_collection_id(1013, 13, "Catan", "https://c.jpg", 1995)
        bgg_client = FakeBggClient(
            [
                BggGame(13, "Catan", "https://c.jpg", 1995, collection_id=1013),
                BggGame(230802, "Azul", "https://a.jpg", 2017, collection_id=1230802),
            ]
        )
        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()
        assert result.created == 1
        assert result.updated == 1
        assert result.total == 2

    def test_empty_collection(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        bgg_client = FakeBggClient([])
        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()
        assert result.created == 0
        assert result.updated == 0
        assert result.total == 0
        assert result.deleted == 0
        assert result.deactivated == 0
        assert result.skip_reason is not None

    def test_missing_and_not_lent_is_hard_deleted(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_collection_id(1013, 13, "Catan", "https://c.jpg", 1995)
        fake_game_repo.upsert_by_collection_id(1014, 14, "Azul", "https://a.jpg", 2017)
        bgg_client = FakeBggClient(
            [BggGame(14, "Azul", "https://a.jpg", 2017, collection_id=1014)]
        )

        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deleted == 1
        assert result.deactivated == 0
        assert fake_game_repo.get_by_collection_id(1013) is None

    def test_missing_and_currently_lent_is_soft_deleted(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        game, _ = fake_game_repo.upsert_by_collection_id(
            1013, 13, "Catan", "https://c.jpg", 1995
        )
        fake_game_repo.upsert_by_collection_id(1014, 14, "Azul", "https://a.jpg", 2017)
        fake_loan_repo.set_active_loan(game.id, _loan(game.id))
        bgg_client = FakeBggClient(
            [BggGame(14, "Azul", "https://a.jpg", 2017, collection_id=1014)]
        )

        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deactivated == 1
        assert result.deleted == 0
        stored = fake_game_repo.get_by_collection_id(1013)
        assert stored is not None
        assert stored.is_active is False

    def test_present_items_are_untouched(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_collection_id(1013, 13, "Catan", "https://c.jpg", 1995)
        bgg_client = FakeBggClient(
            [BggGame(13, "Catan", "https://c.jpg", 1995, collection_id=1013)]
        )

        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deleted == 0
        assert result.deactivated == 0
        assert fake_game_repo.get_by_collection_id(1013) is not None

    def test_previously_soft_deleted_still_lent_stays_soft_deleted(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        game, _ = fake_game_repo.upsert_by_collection_id(
            1013, 13, "Catan", "https://c.jpg", 1995
        )
        fake_game_repo.upsert_by_collection_id(1014, 14, "Azul", "https://a.jpg", 2017)
        fake_game_repo.deactivate_by_collection_ids([1013])
        fake_loan_repo.set_active_loan(game.id, _loan(game.id))
        bgg_client = FakeBggClient(
            [BggGame(14, "Azul", "https://a.jpg", 2017, collection_id=1014)]
        )

        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deleted == 0
        stored = fake_game_repo.get_by_collection_id(1013)
        assert stored is not None
        assert stored.is_active is False

    def test_previously_soft_deleted_no_longer_lent_is_hard_deleted(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_collection_id(1013, 13, "Catan", "https://c.jpg", 1995)
        fake_game_repo.upsert_by_collection_id(1014, 14, "Azul", "https://a.jpg", 2017)
        fake_game_repo.deactivate_by_collection_ids([1013])
        bgg_client = FakeBggClient(
            [BggGame(14, "Azul", "https://a.jpg", 2017, collection_id=1014)]
        )

        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deleted == 1
        assert fake_game_repo.get_by_collection_id(1013) is None

    def test_previously_soft_deleted_fk_blocked_stays_soft_deleted(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_collection_id(1013, 13, "Catan", "https://c.jpg", 1995)
        fake_game_repo.upsert_by_collection_id(1014, 14, "Azul", "https://a.jpg", 2017)
        fake_game_repo.deactivate_by_collection_ids([1013])
        fake_game_repo.blocked_collection_ids.add(1013)
        bgg_client = FakeBggClient(
            [BggGame(14, "Azul", "https://a.jpg", 2017, collection_id=1014)]
        )

        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deleted == 0
        assert result.deactivated == 1
        stored = fake_game_repo.get_by_collection_id(1013)
        assert stored is not None
        assert stored.is_active is False

    def test_drastic_drop_skips_newly_missing_but_not_stale_inactive(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_collection_id(1013, 13, "Catan", "https://c.jpg", 1995)
        fake_game_repo.upsert_by_collection_id(1014, 14, "Azul", "https://a.jpg", 2017)
        fake_game_repo.upsert_by_collection_id(
            1015, 15, "Pandemic", "https://p.jpg", 2008
        )
        fake_game_repo.upsert_by_collection_id(
            1016, 16, "Ticket to Ride", "https://t.jpg", 2004
        )
        fake_game_repo.deactivate_by_collection_ids([1016])
        # only 1 of 3 active items remains -> > 50% missing, guard trips
        bgg_client = FakeBggClient(
            [BggGame(13, "Catan", "https://c.jpg", 1995, collection_id=1013)]
        )

        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.skip_reason is not None
        # newly-missing (1014, 1015) are neither deleted nor deactivated
        game_1014 = fake_game_repo.get_by_collection_id(1014)
        game_1015 = fake_game_repo.get_by_collection_id(1015)
        assert game_1014 is not None
        assert game_1014.is_active is True
        assert game_1015 is not None
        assert game_1015.is_active is True
        # already-inactive stale item (1016) is still reconciled regardless
        assert fake_game_repo.get_by_collection_id(1016) is None
        assert result.deleted == 1

    def test_reappearing_item_is_reactivated(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_collection_id(1013, 13, "Catan", "https://c.jpg", 1995)
        fake_game_repo.deactivate_by_collection_ids([1013])
        deactivated = fake_game_repo.get_by_collection_id(1013)
        assert deactivated is not None
        assert deactivated.is_active is False

        bgg_client = FakeBggClient(
            [BggGame(13, "Catan", "https://c.jpg", 1995, collection_id=1013)]
        )
        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        use_case.execute()

        stored = fake_game_repo.get_by_collection_id(1013)
        assert stored is not None
        assert stored.is_active is True

    def test_legacy_row_adopts_collection_id_on_first_run(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        """A row imported before collection-id identity existed (bgg_id-keyed
        only) must adopt its collection_id on the next import — not be
        wrongly treated as missing, and not spawn a duplicate row."""
        legacy = fake_game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        assert legacy.bgg_collection_id is None

        bgg_client = FakeBggClient(
            [BggGame(13, "Catan", "https://c.jpg", 1995, collection_id=1013)]
        )
        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.created == 0
        assert result.updated == 1
        assert result.deleted == 0
        assert result.deactivated == 0
        assert result.skip_reason is None
        assert len(fake_game_repo.list_all()) == 1
        adopted = fake_game_repo.get_by_collection_id(1013)
        assert adopted is not None
        assert adopted.id == legacy.id

    def test_bgg_id_shared_by_distinct_items_creates_separate_rows(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        """BGG can list several distinct owned items under one bgg_id
        (objectid) — they must become separate catalog rows, keyed by their
        own distinct collection_id."""
        bgg_client = FakeBggClient(
            [
                BggGame(
                    268620,
                    "Similo: Mitos",
                    "https://mitos.jpg",
                    2020,
                    collection_id=146444331,
                    image_url="mitos_full.jpg",
                ),
                BggGame(
                    268620,
                    "Similo: Historia",
                    "https://historia.jpg",
                    2020,
                    collection_id=146444335,
                    image_url="historia_full.jpg",
                ),
            ],
            {268620: _details(bgg_id=268620, categories=("Deduction",))},
        )
        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.created == 2
        all_games = fake_game_repo.list_all()
        assert len(all_games) == 2
        names = {g.name for g in all_games}
        assert names == {"Similo: Mitos", "Similo: Historia"}
        images = {g.name: g.image_url for g in all_games}
        assert images == {
            "Similo: Mitos": "mitos_full.jpg",
            "Similo: Historia": "historia_full.jpg",
        }
        assert {g.categories for g in all_games} == {("Deduction",)}
        assert {g.playing_time for g in all_games} == {90}
        slugs = {g.slug for g in all_games}
        assert slugs == {"similo-mitos", "similo-historia"}

    def test_missing_shared_details_preserve_each_copy_metadata(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_collection_id(
            9001,
            5000,
            "Old A",
            "old-a-thumb.jpg",
            image_url="stored-a.jpg",
            playing_time=30,
            description="Stored A",
            categories=("Category A",),
        )
        fake_game_repo.upsert_by_collection_id(
            9002,
            5000,
            "Old B",
            "old-b-thumb.jpg",
            image_url="stored-b.jpg",
            playing_time=45,
            description="Stored B",
            categories=("Category B",),
        )
        bgg_client = FakeBggClient(
            [
                BggGame(5000, "New A", "new-a-thumb.jpg", 2020, collection_id=9001),
                BggGame(5000, "New B", "new-b-thumb.jpg", 2020, collection_id=9002),
            ]
        )

        result = ImportGamesUseCase(
            fake_game_repo, bgg_client, fake_loan_repo
        ).execute()

        assert result.updated == 2
        first = fake_game_repo.get_by_collection_id(9001)
        second = fake_game_repo.get_by_collection_id(9002)
        assert first is not None
        assert second is not None
        assert (first.name, first.thumbnail_url) == ("New A", "new-a-thumb.jpg")
        assert (second.name, second.thumbnail_url) == ("New B", "new-b-thumb.jpg")
        assert (
            first.image_url,
            first.playing_time,
            first.description,
            first.categories,
        ) == (
            "stored-a.jpg",
            30,
            "Stored A",
            ("Category A",),
        )
        assert (
            second.image_url,
            second.playing_time,
            second.description,
            second.categories,
        ) == ("stored-b.jpg", 45, "Stored B", ("Category B",))


class TestLegacyRowRemoval:
    """Legacy rows (bgg_collection_id IS NULL) that fall out of the BGG
    collection must be reconciled the same way collection-id rows are —
    they must not be silently kept forever. Each test keeps enough
    surviving collection-id games in the fetch so the combined (collection
    + legacy) missing ratio stays under the 50% guard."""

    def _surviving_games(self) -> list[BggGame]:
        return [
            BggGame(101, "Catan", "https://c.jpg", 1995, collection_id=2101),
            BggGame(102, "Azul", "https://a.jpg", 2017, collection_id=2102),
            BggGame(103, "Pandemic", "https://p.jpg", 2008, collection_id=2103),
        ]

    def _seed_surviving_games(self, fake_game_repo: FakeGameRepository) -> None:
        fake_game_repo.upsert_by_collection_id(
            2101, 101, "Catan", "https://c.jpg", 1995
        )
        fake_game_repo.upsert_by_collection_id(2102, 102, "Azul", "https://a.jpg", 2017)
        fake_game_repo.upsert_by_collection_id(
            2103, 103, "Pandemic", "https://p.jpg", 2008
        )

    def test_active_legacy_row_absent_from_fetch_is_deleted(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        self._seed_surviving_games(fake_game_repo)
        legacy = fake_game_repo.upsert_by_bgg_id(
            715, "Fuga de Colditz", "https://f.jpg"
        )
        assert legacy.bgg_collection_id is None
        bgg_client = FakeBggClient(self._surviving_games())

        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deleted == 1
        assert result.deactivated == 0
        assert result.skip_reason is None
        assert fake_game_repo.get_by_bgg_id(715) is None
        assert {g.bgg_id for g in fake_game_repo.list_all()} == {101, 102, 103}

    def test_active_legacy_row_absent_from_fetch_but_lent_is_deactivated(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        self._seed_surviving_games(fake_game_repo)
        legacy = fake_game_repo.upsert_by_bgg_id(
            715, "Fuga de Colditz", "https://f.jpg"
        )
        fake_loan_repo.set_active_loan(legacy.id, _loan(legacy.id))
        bgg_client = FakeBggClient(self._surviving_games())

        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deleted == 0
        assert result.deactivated == 1
        assert result.skip_reason is None
        stored = fake_game_repo.get_by_bgg_id(715)
        assert stored is not None
        assert stored.is_active is False

    def test_legacy_row_still_in_fetch_is_adopted_not_removed(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        self._seed_surviving_games(fake_game_repo)
        legacy = fake_game_repo.upsert_by_bgg_id(
            715, "Fuga de Colditz", "https://f.jpg"
        )
        bgg_client = FakeBggClient(
            [
                *self._surviving_games(),
                BggGame(
                    715, "Fuga de Colditz", "https://f.jpg", 1955, collection_id=2715
                ),
            ]
        )

        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deleted == 0
        assert result.deactivated == 0
        assert result.updated == 4
        assert result.skip_reason is None
        adopted = fake_game_repo.get_by_collection_id(2715)
        assert adopted is not None
        assert adopted.id == legacy.id
        assert adopted.is_active is True

    def test_empty_fetch_leaves_legacy_rows_untouched(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        legacy = fake_game_repo.upsert_by_bgg_id(
            715, "Fuga de Colditz", "https://f.jpg"
        )
        bgg_client = FakeBggClient([])

        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deleted == 0
        assert result.deactivated == 0
        assert result.skip_reason is not None
        stored = fake_game_repo.get_by_bgg_id(715)
        assert stored is not None
        assert stored.id == legacy.id
        assert stored.is_active is True
