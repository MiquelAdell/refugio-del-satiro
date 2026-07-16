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
        assert bgg_ids == [game.bgg_id for game in self._games]
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
                BggGame(13, "Catan", "https://c.jpg", 1995),
                BggGame(230802, "Azul", "https://a.jpg", 2017),
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
        fake_game_repo.upsert_by_bgg_id(13, "Catan", "https://old.jpg", 1995)
        bgg_client = FakeBggClient(
            [BggGame(13, "Catan: 25th Anniversary", "https://new.jpg", 1995)]
        )
        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()
        assert result.created == 0
        assert result.updated == 1
        game = fake_game_repo.get_by_bgg_id(13)
        assert game is not None
        assert game.name == "Catan: 25th Anniversary"

    def test_mixed_create_and_update(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        bgg_client = FakeBggClient(
            [
                BggGame(13, "Catan", "https://c.jpg", 1995),
                BggGame(230802, "Azul", "https://a.jpg", 2017),
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
        fake_game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        fake_game_repo.upsert_by_bgg_id(14, "Azul", "https://a.jpg", 2017)
        bgg_client = FakeBggClient([BggGame(14, "Azul", "https://a.jpg", 2017)])

        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deleted == 1
        assert result.deactivated == 0
        assert fake_game_repo.get_by_bgg_id(13) is None

    def test_missing_and_currently_lent_is_soft_deleted(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        game = fake_game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        fake_game_repo.upsert_by_bgg_id(14, "Azul", "https://a.jpg", 2017)
        fake_loan_repo.set_active_loan(game.id, _loan(game.id))
        bgg_client = FakeBggClient([BggGame(14, "Azul", "https://a.jpg", 2017)])

        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deactivated == 1
        assert result.deleted == 0
        stored = fake_game_repo.get_by_bgg_id(13)
        assert stored is not None
        assert stored.is_active is False

    def test_present_items_are_untouched(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        bgg_client = FakeBggClient([BggGame(13, "Catan", "https://c.jpg", 1995)])

        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deleted == 0
        assert result.deactivated == 0
        assert fake_game_repo.get_by_bgg_id(13) is not None

    def test_previously_soft_deleted_still_lent_stays_soft_deleted(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        game = fake_game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        fake_game_repo.upsert_by_bgg_id(14, "Azul", "https://a.jpg", 2017)
        fake_game_repo.deactivate_by_bgg_ids([13])
        fake_loan_repo.set_active_loan(game.id, _loan(game.id))
        bgg_client = FakeBggClient([BggGame(14, "Azul", "https://a.jpg", 2017)])

        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deleted == 0
        stored = fake_game_repo.get_by_bgg_id(13)
        assert stored is not None
        assert stored.is_active is False

    def test_previously_soft_deleted_no_longer_lent_is_hard_deleted(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        fake_game_repo.upsert_by_bgg_id(14, "Azul", "https://a.jpg", 2017)
        fake_game_repo.deactivate_by_bgg_ids([13])
        bgg_client = FakeBggClient([BggGame(14, "Azul", "https://a.jpg", 2017)])

        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deleted == 1
        assert fake_game_repo.get_by_bgg_id(13) is None

    def test_previously_soft_deleted_fk_blocked_stays_soft_deleted(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        fake_game_repo.upsert_by_bgg_id(14, "Azul", "https://a.jpg", 2017)
        fake_game_repo.deactivate_by_bgg_ids([13])
        fake_game_repo.blocked_bgg_ids.add(13)
        bgg_client = FakeBggClient([BggGame(14, "Azul", "https://a.jpg", 2017)])

        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.deleted == 0
        assert result.deactivated == 1
        stored = fake_game_repo.get_by_bgg_id(13)
        assert stored is not None
        assert stored.is_active is False

    def test_drastic_drop_skips_newly_missing_but_not_stale_inactive(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        fake_game_repo.upsert_by_bgg_id(14, "Azul", "https://a.jpg", 2017)
        fake_game_repo.upsert_by_bgg_id(15, "Pandemic", "https://p.jpg", 2008)
        fake_game_repo.upsert_by_bgg_id(16, "Ticket to Ride", "https://t.jpg", 2004)
        fake_game_repo.deactivate_by_bgg_ids([16])
        # only 1 of 3 active items remains -> > 50% missing, guard trips
        bgg_client = FakeBggClient([BggGame(13, "Catan", "https://c.jpg", 1995)])

        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        result = use_case.execute()

        assert result.skip_reason is not None
        # newly-missing (14, 15) are neither deleted nor deactivated
        assert fake_game_repo.get_by_bgg_id(14) is not None
        assert fake_game_repo.get_by_bgg_id(14).is_active is True
        assert fake_game_repo.get_by_bgg_id(15) is not None
        assert fake_game_repo.get_by_bgg_id(15).is_active is True
        # already-inactive stale item (16) is still reconciled regardless
        assert fake_game_repo.get_by_bgg_id(16) is None
        assert result.deleted == 1

    def test_reappearing_item_is_reactivated(
        self, fake_game_repo: FakeGameRepository, fake_loan_repo: FakeLoanRepository
    ) -> None:
        fake_game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        fake_game_repo.deactivate_by_bgg_ids([13])
        assert fake_game_repo.get_by_bgg_id(13).is_active is False

        bgg_client = FakeBggClient([BggGame(13, "Catan", "https://c.jpg", 1995)])
        use_case = ImportGamesUseCase(fake_game_repo, bgg_client, fake_loan_repo)
        use_case.execute()

        stored = fake_game_repo.get_by_bgg_id(13)
        assert stored is not None
        assert stored.is_active is True
