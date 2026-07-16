from __future__ import annotations

from datetime import UTC, datetime

from backend.domain.entities.game import Game
from backend.domain.slug import slugify
from backend.domain.use_cases.list_rpg_items import ListRpgItemsUseCase
from tests.domain.use_cases.test_list_games import (
    FakeGameRepository,
    FakeLoanRepository,
    FakeMemberRepository,
    _make_loan,
    _make_member,
)

NOW = datetime.now(UTC)

RPG_ITEM_TYPE = "rpgitem"
BOARDGAME_TYPE = "boardgame"


def _make_rpg_item(id: int, name: str = "Test RPG") -> Game:
    return Game(
        id=id,
        bgg_id=id * 100,
        name=name,
        slug=slugify(name),
        thumbnail_url=f"https://example.com/{id}.jpg",
        image_url=f"https://example.com/{id}_full.jpg",
        year_published=2020,
        min_players=0,
        max_players=0,
        playing_time=0,
        bgg_rating=7.5,
        location="armari",
        created_at=NOW,
        updated_at=NOW,
        item_type=RPG_ITEM_TYPE,
        description="A great RPG book.",
        categories=("Fantasy", "Mythology"),
        publication_types=("Core Rules", "Sourcebook"),
    )


def _make_boardgame(id: int, name: str = "Test Game") -> Game:
    return Game(
        id=id,
        bgg_id=id * 100,
        name=name,
        slug=slugify(name),
        thumbnail_url=f"https://example.com/{id}.jpg",
        image_url=f"https://example.com/{id}_full.jpg",
        year_published=2020,
        min_players=2,
        max_players=4,
        playing_time=60,
        bgg_rating=7.0,
        location="armari",
        created_at=NOW,
        updated_at=NOW,
        item_type=BOARDGAME_TYPE,
    )


class TestListRpgItemsUseCase:
    def test_empty_catalog(self) -> None:
        use_case = ListRpgItemsUseCase(
            game_repo=FakeGameRepository(),
            loan_repo=FakeLoanRepository(),
            member_repo=FakeMemberRepository(),
        )

        result = use_case.execute()

        assert result == []

    def test_returns_only_rpg_items(self) -> None:
        rpg = _make_rpg_item(1, "Dungeons & Dragons")
        boardgame = _make_boardgame(2, "Catan")
        use_case = ListRpgItemsUseCase(
            game_repo=FakeGameRepository([rpg, boardgame]),
            loan_repo=FakeLoanRepository(),
            member_repo=FakeMemberRepository(),
        )

        result = use_case.execute()

        assert len(result) == 1
        assert result[0].id == 1
        assert result[0].name == "Dungeons & Dragons"
        assert result[0].description == "A great RPG book."
        assert result[0].categories == ("Fantasy", "Mythology")
        assert result[0].publication_types == ("Core Rules", "Sourcebook")

    def test_returns_all_rpg_items(self) -> None:
        rpg1 = _make_rpg_item(1, "Pathfinder")
        rpg2 = _make_rpg_item(2, "Call of Cthulhu")
        use_case = ListRpgItemsUseCase(
            game_repo=FakeGameRepository([rpg1, rpg2]),
            loan_repo=FakeLoanRepository(),
            member_repo=FakeMemberRepository(),
        )

        result = use_case.execute()

        assert len(result) == 2
        names = {item.name for item in result}
        assert names == {"Pathfinder", "Call of Cthulhu"}

    def test_available_rpg_item_has_correct_status(self) -> None:
        rpg = _make_rpg_item(1, "Pathfinder")
        use_case = ListRpgItemsUseCase(
            game_repo=FakeGameRepository([rpg]),
            loan_repo=FakeLoanRepository(),
            member_repo=FakeMemberRepository(),
        )

        result = use_case.execute()

        assert len(result) == 1
        assert result[0].status == "available"
        assert result[0].categories == ("Fantasy", "Mythology")
        assert result[0].publication_types == ("Core Rules", "Sourcebook")
        assert result[0].borrower_display_name is None
        assert result[0].loan_id is None

    def test_lent_rpg_item_exposes_borrower(self) -> None:
        rpg = _make_rpg_item(1, "Shadowrun")
        member = _make_member(10, display_name="Bob")
        loan = _make_loan(100, game_id=1, member_id=10)
        use_case = ListRpgItemsUseCase(
            game_repo=FakeGameRepository([rpg]),
            loan_repo=FakeLoanRepository([loan]),
            member_repo=FakeMemberRepository([member]),
        )

        result = use_case.execute()

        assert len(result) == 1
        assert result[0].status == "lent"
        assert result[0].categories == ("Fantasy", "Mythology")
        assert result[0].publication_types == ("Core Rules", "Sourcebook")
        assert result[0].borrower_display_name == "Bob"
        assert result[0].loan_id == 100
