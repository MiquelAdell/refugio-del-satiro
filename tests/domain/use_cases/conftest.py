from __future__ import annotations

from collections.abc import Collection
from datetime import UTC, datetime

import pytest

from backend.domain.entities.game import Game
from backend.domain.entities.loan import Loan
from backend.domain.slug import ensure_unique, slugify


class FakeGameRepository:
    """Shared fake for import-reconciliation tests.

    ``blocked_bgg_ids`` is a test-only escape hatch: populate it directly to
    simulate a game that has loan history and is therefore FK-blocked from
    hard deletion, without reimplementing real SQLite FK semantics here.
    """

    def __init__(self) -> None:
        self._games: dict[int, Game] = {}
        self._next_id = 1
        self.blocked_bgg_ids: set[int] = set()

    def get_by_id(self, game_id: int) -> Game | None:
        return self._games.get(game_id)

    def get_by_slug(self, slug: str) -> Game | None:
        return next((g for g in self._games.values() if g.slug == slug), None)

    def get_by_bgg_id(self, bgg_id: int) -> Game | None:
        return next((g for g in self._games.values() if g.bgg_id == bgg_id), None)

    def list_all(self) -> list[Game]:
        return sorted(self._games.values(), key=lambda g: g.name)

    def list_by_type(self, item_type: str) -> list[Game]:
        return sorted(
            (
                g
                for g in self._games.values()
                if g.item_type == item_type and g.is_active
            ),
            key=lambda g: g.name,
        )

    def list_by_type_including_inactive(self, item_type: str) -> list[Game]:
        return sorted(
            (g for g in self._games.values() if g.item_type == item_type),
            key=lambda g: g.name,
        )

    def deactivate_by_bgg_ids(self, bgg_ids: Collection[int]) -> int:
        count = 0
        for bgg_id in bgg_ids:
            game = self.get_by_bgg_id(bgg_id)
            if game is not None and game.is_active:
                self._games[game.id] = _replace_is_active(game, is_active=False)
                count += 1
        return count

    def delete_by_bgg_ids(
        self, bgg_ids: Collection[int]
    ) -> tuple[frozenset[int], frozenset[int]]:
        deleted: set[int] = set()
        blocked: set[int] = set()
        for bgg_id in bgg_ids:
            if bgg_id in self.blocked_bgg_ids:
                blocked.add(bgg_id)
                continue
            game = self.get_by_bgg_id(bgg_id)
            if game is not None:
                del self._games[game.id]
                deleted.add(bgg_id)
        return frozenset(deleted), frozenset(blocked)

    def upsert_by_bgg_id(
        self,
        bgg_id: int,
        name: str,
        thumbnail_url: str,
        image_url: str = "",
        year_published: int = 0,
        min_players: int = 0,
        max_players: int = 0,
        playing_time: int = 0,
        bgg_rating: float = 0.0,
        location: str = "armari",
        item_type: str = "boardgame",
        description: str = "",
        categories: tuple[str, ...] = (),
        publication_types: tuple[str, ...] = (),
    ) -> Game:
        now = datetime.now(UTC)
        existing = self.get_by_bgg_id(bgg_id)
        slug = (
            existing.slug
            if existing and slugify(existing.name) == slugify(name)
            else ensure_unique(
                slugify(name),
                (g.slug for g in self._games.values() if g.bgg_id != bgg_id),
            )
        )
        game = Game(
            id=existing.id if existing else self._next_id,
            bgg_id=bgg_id,
            name=name,
            slug=slug,
            thumbnail_url=thumbnail_url,
            image_url=image_url,
            year_published=year_published,
            min_players=min_players,
            max_players=max_players,
            playing_time=playing_time,
            bgg_rating=bgg_rating,
            location=location,
            created_at=existing.created_at if existing else now,
            updated_at=now,
            item_type=item_type,
            description=description,
            categories=categories,
            publication_types=publication_types,
            is_active=True,
        )
        self._games[game.id] = game
        if existing is None:
            self._next_id += 1
        return game


def _replace_is_active(game: Game, *, is_active: bool) -> Game:
    return Game(
        id=game.id,
        bgg_id=game.bgg_id,
        name=game.name,
        slug=game.slug,
        thumbnail_url=game.thumbnail_url,
        image_url=game.image_url,
        year_published=game.year_published,
        min_players=game.min_players,
        max_players=game.max_players,
        playing_time=game.playing_time,
        bgg_rating=game.bgg_rating,
        location=game.location,
        created_at=game.created_at,
        updated_at=game.updated_at,
        item_type=game.item_type,
        description=game.description,
        categories=game.categories,
        publication_types=game.publication_types,
        is_active=is_active,
    )


class FakeLoanRepository:
    """Settable "active loan for this game_id" mapping."""

    def __init__(self) -> None:
        self._active_by_game_id: dict[int, Loan] = {}

    def set_active_loan(self, game_id: int, loan: Loan) -> None:
        self._active_by_game_id[game_id] = loan

    def get_active_by_game_id(self, game_id: int) -> Loan | None:
        return self._active_by_game_id.get(game_id)


@pytest.fixture
def fake_game_repo() -> FakeGameRepository:
    return FakeGameRepository()


@pytest.fixture
def fake_loan_repo() -> FakeLoanRepository:
    return FakeLoanRepository()
