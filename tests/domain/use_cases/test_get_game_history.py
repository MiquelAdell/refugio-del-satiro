from __future__ import annotations

import dataclasses
from datetime import UTC, datetime

from backend.domain.entities.game import Game
from backend.domain.entities.loan import Loan
from backend.domain.entities.member import Member
from backend.domain.use_cases.get_game_history import GetGameHistoryUseCase

# ── Fake repositories ──────────────────────────────────────────────


class FakeGameRepository:
    def __init__(self, games: list[Game] | None = None) -> None:
        self._games: list[Game] = games or []

    def get_by_id(self, game_id: int) -> Game | None:
        return next((g for g in self._games if g.id == game_id), None)

    def get_by_slug(self, slug: str) -> Game | None:
        return next((g for g in self._games if g.slug == slug), None)

    def get_by_bgg_id(self, bgg_id: int) -> Game | None:
        return next((g for g in self._games if g.bgg_id == bgg_id), None)

    def list_all(self) -> list[Game]:
        return list(self._games)

    def upsert_by_bgg_id(self, **kwargs: object) -> Game:
        raise NotImplementedError


def _make_game(id: int, slug: str = "catan") -> Game:
    return Game(
        id=id,
        bgg_id=id * 100,
        name=slug.replace("-", " ").title(),
        slug=slug,
        thumbnail_url="https://example.com/x.jpg",
        image_url="https://example.com/x_full.jpg",
        year_published=2020,
        min_players=2,
        max_players=4,
        playing_time=60,
        bgg_rating=7.0,
        location="armari",
        created_at=NOW,
        updated_at=NOW,
    )


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
        return sorted(
            [lo for lo in self._loans if lo.game_id == game_id],
            key=lambda lo: lo.borrowed_at,
            reverse=True,
        )

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


def _make_member(id: int, display_name: str) -> Member:
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


def _make_loan(
    id: int,
    game_id: int,
    member_id: int,
    borrowed_at: datetime,
    returned_at: datetime | None = None,
) -> Loan:
    return Loan(
        id=id,
        game_id=game_id,
        member_id=member_id,
        borrowed_at=borrowed_at,
        returned_at=returned_at,
    )


# ── Tests ───────────────────────────────────────────────────────────


class TestGetGameHistoryUseCase:
    def test_unknown_slug_returns_none(self) -> None:
        use_case = GetGameHistoryUseCase(
            game_repo=FakeGameRepository(),
            loan_repo=FakeLoanRepository(),
            member_repo=FakeMemberRepository(),
        )

        result = use_case.execute(slug="no-existe")

        assert result is None

    def test_known_game_with_no_loans_returns_empty_list(self) -> None:
        game = _make_game(1, "catan")
        use_case = GetGameHistoryUseCase(
            game_repo=FakeGameRepository([game]),
            loan_repo=FakeLoanRepository(),
            member_repo=FakeMemberRepository(),
        )

        result = use_case.execute(slug="catan")

        assert result == []

    def test_mixed_active_and_returned_loans(self) -> None:
        alice = _make_member(1, "Alice")
        bob = _make_member(2, "Bob")
        game = _make_game(1, "catan")

        borrowed_earlier = datetime(2025, 1, 1, tzinfo=UTC)
        returned_date = datetime(2025, 1, 15, tzinfo=UTC)
        borrowed_later = datetime(2025, 2, 1, tzinfo=UTC)

        returned_loan = _make_loan(
            id=10,
            game_id=1,
            member_id=1,
            borrowed_at=borrowed_earlier,
            returned_at=returned_date,
        )
        active_loan = _make_loan(
            id=11,
            game_id=1,
            member_id=2,
            borrowed_at=borrowed_later,
        )

        use_case = GetGameHistoryUseCase(
            game_repo=FakeGameRepository([game]),
            loan_repo=FakeLoanRepository([returned_loan, active_loan]),
            member_repo=FakeMemberRepository([alice, bob]),
        )

        result = use_case.execute(slug="catan")

        assert result is not None
        assert len(result) == 2

        # Most recent first
        assert result[0].member_display_name == "Bob"
        assert result[0].borrowed_at == borrowed_later
        assert result[0].returned_at is None

        assert result[1].member_display_name == "Alice"
        assert result[1].borrowed_at == borrowed_earlier
        assert result[1].returned_at == returned_date

    def test_deactivated_game_history_still_returns_entries(self) -> None:
        """Loan history for a soft-deleted (deactivated) game must stay
        reachable — is_active is deliberately ignored."""
        game = dataclasses.replace(_make_game(1, "catan"), is_active=False)
        loan = _make_loan(
            id=10, game_id=1, member_id=1, borrowed_at=NOW, returned_at=NOW
        )
        member = _make_member(1, "Alice")

        use_case = GetGameHistoryUseCase(
            game_repo=FakeGameRepository([game]),
            loan_repo=FakeLoanRepository([loan]),
            member_repo=FakeMemberRepository([member]),
        )

        result = use_case.execute(slug="catan")

        assert result is not None
        assert len(result) == 1

    def test_item_type_scoping_returns_none_for_wrong_type(self) -> None:
        boardgame = _make_game(1, "catan")
        use_case = GetGameHistoryUseCase(
            game_repo=FakeGameRepository([boardgame]),
            loan_repo=FakeLoanRepository(),
            member_repo=FakeMemberRepository(),
            item_type="rpgitem",
        )

        assert use_case.execute(slug="catan") is None

    def test_item_type_scoping_allows_matching_type(self) -> None:
        boardgame = _make_game(1, "catan")
        use_case = GetGameHistoryUseCase(
            game_repo=FakeGameRepository([boardgame]),
            loan_repo=FakeLoanRepository(),
            member_repo=FakeMemberRepository(),
            item_type="boardgame",
        )

        assert use_case.execute(slug="catan") == []
