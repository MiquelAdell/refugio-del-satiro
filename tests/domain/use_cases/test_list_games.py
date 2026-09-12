from __future__ import annotations

from datetime import UTC, datetime

from backend.domain.entities.game import Game
from backend.domain.entities.loan import Loan
from backend.domain.entities.member import Member
from backend.domain.slug import slugify
from backend.domain.use_cases.list_games import ListGamesUseCase

# ── Fake repositories ──────────────────────────────────────────────


class FakeGameRepository:
    def __init__(self, games: list[Game] | None = None) -> None:
        self._games: dict[int, Game] = {g.id: g for g in (games or [])}

    def get_by_id(self, game_id: int) -> Game | None:
        return self._games.get(game_id)

    def get_by_slug(self, slug: str) -> Game | None:
        return next((g for g in self._games.values() if g.slug == slug), None)

    def get_by_bgg_id(self, bgg_id: int) -> Game | None:
        return next((g for g in self._games.values() if g.bgg_id == bgg_id), None)

    def list_all(self) -> list[Game]:
        return list(self._games.values())

    def list_by_type(self, item_type: str) -> list[Game]:
        return [g for g in self._games.values() if g.item_type == item_type]

    def upsert_by_bgg_id(
        self,
        bgg_id: int,
        name: str,
        thumbnail_url: str,
        image_url: str = "",
        year_published: int = 0,
    ) -> Game:
        raise NotImplementedError


class FakeLoanRepository:
    def __init__(self, loans: list[Loan] | None = None) -> None:
        self._loans: list[Loan] = loans or []

    def get_by_id(self, loan_id: int) -> Loan | None:
        return next((lo for lo in self._loans if lo.id == loan_id), None)

    def get_active_by_game_id(self, game_id: int) -> Loan | None:
        return next(
            (
                lo
                for lo in self._loans
                if lo.game_id == game_id and lo.returned_at is None
            ),
            None,
        )

    def list_active_by_member_id(self, member_id: int) -> list[Loan]:
        return [
            lo
            for lo in self._loans
            if lo.member_id == member_id and lo.returned_at is None
        ]

    def list_by_game_id(self, game_id: int) -> list[Loan]:
        return [lo for lo in self._loans if lo.game_id == game_id]

    def create(self, game_id: int, member_id: int) -> Loan:
        raise NotImplementedError

    def mark_returned(self, loan_id: int) -> Loan:
        raise NotImplementedError


class FakeMemberRepository:
    def __init__(self, members: list[Member] | None = None) -> None:
        self._members: dict[int, Member] = {m.id: m for m in (members or [])}

    def get_by_id(self, member_id: int) -> Member | None:
        return self._members.get(member_id)

    def get_by_email(self, email: str) -> Member | None:
        return next((m for m in self._members.values() if m.email == email), None)

    def list_all(self) -> list[Member]:
        return list(self._members.values())

    def upsert_by_email(self, **kwargs: object) -> Member:
        raise NotImplementedError

    def update_display_name(self, member_id: int, display_name: str) -> None:
        raise NotImplementedError

    def set_password_hash(self, member_id: int, password_hash: str) -> None:
        raise NotImplementedError


# ── Helpers ─────────────────────────────────────────────────────────

NOW = datetime.now(UTC)


def _make_game(id: int, name: str = "Test Game") -> Game:
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
        location="armario",
        created_at=NOW,
        updated_at=NOW,
        description="Trade and build across the island.",
        categories=("Economic", "Negotiation"),
    )


def _make_member(id: int, display_name: str = "Alice") -> Member:
    return Member(
        id=id,
        member_number=id,
        first_name="First",
        last_name="Last",
        nickname=None,
        phone=None,
        email=f"member{id}@example.com",
        display_name=display_name,
        password_hash=None,
        is_admin=False,
        is_active=True,
        created_at=NOW,
        updated_at=NOW,
    )


def _make_loan(id: int, game_id: int, member_id: int, returned: bool = False) -> Loan:
    return Loan(
        id=id,
        game_id=game_id,
        member_id=member_id,
        borrowed_at=NOW,
        returned_at=NOW if returned else None,
    )


# ── Tests ───────────────────────────────────────────────────────────


class TestListGamesUseCase:
    def test_available_game(self) -> None:
        game = _make_game(1, "Catan")
        use_case = ListGamesUseCase(
            game_repo=FakeGameRepository([game]),
            loan_repo=FakeLoanRepository(),
            member_repo=FakeMemberRepository(),
        )

        result = use_case.execute()

        assert len(result) == 1
        assert result[0].id == 1
        assert result[0].name == "Catan"
        assert result[0].description == "Trade and build across the island."
        assert result[0].categories == ("Economic", "Negotiation")
        assert result[0].status == "available"
        assert result[0].borrower_display_name is None
        assert result[0].loan_id is None

    def test_lent_game(self) -> None:
        game = _make_game(1, "Catan")
        member = _make_member(10, display_name="Bob")
        loan = _make_loan(100, game_id=1, member_id=10)

        use_case = ListGamesUseCase(
            game_repo=FakeGameRepository([game]),
            loan_repo=FakeLoanRepository([loan]),
            member_repo=FakeMemberRepository([member]),
        )

        result = use_case.execute()

        assert len(result) == 1
        assert result[0].status == "lent"
        assert result[0].description == "Trade and build across the island."
        assert result[0].categories == ("Economic", "Negotiation")
        assert result[0].borrower_display_name == "Bob"
        assert result[0].loan_id == 100

    def test_multiple_games_mixed_status(self) -> None:
        game_available = _make_game(1, "Catan")
        game_lent = _make_game(2, "Pandemic")
        game_returned = _make_game(3, "Ticket to Ride")
        member = _make_member(10, display_name="Carol")

        active_loan = _make_loan(100, game_id=2, member_id=10, returned=False)
        returned_loan = _make_loan(101, game_id=3, member_id=10, returned=True)

        use_case = ListGamesUseCase(
            game_repo=FakeGameRepository([game_available, game_lent, game_returned]),
            loan_repo=FakeLoanRepository([active_loan, returned_loan]),
            member_repo=FakeMemberRepository([member]),
        )

        result = use_case.execute()

        assert len(result) == 3

        by_name = {g.name: g for g in result}

        assert by_name["Catan"].status == "available"
        assert by_name["Catan"].borrower_display_name is None

        assert by_name["Pandemic"].status == "lent"
        assert by_name["Pandemic"].borrower_display_name == "Carol"
        assert by_name["Pandemic"].loan_id == 100

        # Game 3 has only a returned loan, so it's available
        assert by_name["Ticket to Ride"].status == "available"
        assert by_name["Ticket to Ride"].borrower_display_name is None
        assert by_name["Ticket to Ride"].loan_id is None
