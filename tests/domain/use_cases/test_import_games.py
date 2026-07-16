from __future__ import annotations

from datetime import UTC, datetime

from backend.data.bgg_client import BggGame
from backend.domain.entities.loan import Loan
from backend.domain.use_cases.import_games import ImportGamesUseCase
from tests.domain.use_cases.conftest import FakeGameRepository, FakeLoanRepository


class FakeBggClient:
    def __init__(self, games: list[BggGame]) -> None:
        self._games = games

    def fetch_owned_games(self) -> list[BggGame]:
        return self._games


def _loan(game_id: int) -> Loan:
    return Loan(
        id=1,
        game_id=game_id,
        member_id=1,
        borrowed_at=datetime.now(UTC),
        returned_at=None,
    )


class TestImportGamesUseCase:
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
            ]
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
        slugs = {g.slug for g in all_games}
        assert slugs == {"similo-mitos", "similo-historia"}
