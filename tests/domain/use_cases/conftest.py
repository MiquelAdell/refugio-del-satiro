from __future__ import annotations

import dataclasses
from collections.abc import Collection
from datetime import UTC, datetime

import pytest

from backend.domain.entities.game import Game
from backend.domain.entities.loan import Loan
from backend.domain.slug import ensure_unique, slugify


class FakeGameRepository:
    """Shared fake for import-reconciliation tests.

    ``blocked_collection_ids`` is a test-only escape hatch: populate it
    directly to simulate a game that has loan history and is therefore
    FK-blocked from hard deletion, without reimplementing real SQLite FK
    semantics here.
    """

    def __init__(self) -> None:
        self._games: dict[int, Game] = {}
        self._next_id = 1
        self.blocked_collection_ids: set[int] = set()
        self.blocked_ids: set[int] = set()

    def get_by_id(self, game_id: int) -> Game | None:
        return self._games.get(game_id)

    def get_by_slug(self, slug: str) -> Game | None:
        return next((g for g in self._games.values() if g.slug == slug), None)

    def get_by_bgg_id(self, bgg_id: int) -> Game | None:
        return next((g for g in self._games.values() if g.bgg_id == bgg_id), None)

    def get_by_collection_id(self, bgg_collection_id: int) -> Game | None:
        return next(
            (
                g
                for g in self._games.values()
                if g.bgg_collection_id == bgg_collection_id
            ),
            None,
        )

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

    def deactivate_by_collection_ids(self, collection_ids: Collection[int]) -> int:
        count = 0
        for collection_id in collection_ids:
            game = self.get_by_collection_id(collection_id)
            if game is not None and game.is_active:
                self._games[game.id] = dataclasses.replace(game, is_active=False)
                count += 1
        return count

    def delete_by_collection_ids(
        self, collection_ids: Collection[int]
    ) -> tuple[frozenset[int], frozenset[int]]:
        deleted: set[int] = set()
        blocked: set[int] = set()
        for collection_id in collection_ids:
            if collection_id in self.blocked_collection_ids:
                blocked.add(collection_id)
                continue
            game = self.get_by_collection_id(collection_id)
            if game is not None:
                del self._games[game.id]
                deleted.add(collection_id)
        return frozenset(deleted), frozenset(blocked)

    def deactivate_by_ids(self, game_ids: Collection[int]) -> int:
        count = 0
        for game_id in game_ids:
            game = self._games.get(game_id)
            if game is not None and game.is_active:
                self._games[game_id] = dataclasses.replace(game, is_active=False)
                count += 1
        return count

    def delete_by_ids(
        self, game_ids: Collection[int]
    ) -> tuple[frozenset[int], frozenset[int]]:
        deleted: set[int] = set()
        blocked: set[int] = set()
        for game_id in game_ids:
            if game_id in self.blocked_ids:
                blocked.add(game_id)
                continue
            if game_id in self._games:
                del self._games[game_id]
                deleted.add(game_id)
        return frozenset(deleted), frozenset(blocked)

    def _slug_for(self, existing: Game | None, name: str) -> str:
        if existing is not None and slugify(existing.name) == slugify(name):
            return existing.slug
        return ensure_unique(
            slugify(name),
            (
                g.slug
                for g in self._games.values()
                if existing is None or g.id != existing.id
            ),
        )

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
        location: str = "armario",
        item_type: str = "boardgame",
        description: str = "",
        categories: tuple[str, ...] = (),
        publication_types: tuple[str, ...] = (),
        min_age: int = 0,
        primary_tag: str = "",
    ) -> Game:
        """Legacy path: no collection_id concept."""
        now = datetime.now(UTC)
        existing = self.get_by_bgg_id(bgg_id)
        slug = self._slug_for(existing, name)
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
            bgg_collection_id=existing.bgg_collection_id if existing else None,
            min_age=min_age,
            primary_tag=primary_tag,
        )
        self._games[game.id] = game
        if existing is None:
            self._next_id += 1
        return game

    def upsert_by_collection_id(
        self,
        bgg_collection_id: int,
        bgg_id: int,
        name: str,
        thumbnail_url: str,
        image_url: str = "",
        year_published: int = 0,
        min_players: int = 0,
        max_players: int = 0,
        playing_time: int = 0,
        bgg_rating: float = 0.0,
        location: str = "armario",
        item_type: str = "boardgame",
        description: str = "",
        categories: tuple[str, ...] = (),
        publication_types: tuple[str, ...] = (),
        min_age: int = 0,
        primary_tag: str = "",
    ) -> tuple[Game, bool]:
        now = datetime.now(UTC)
        existing = self.get_by_collection_id(bgg_collection_id)
        if existing is None:
            existing = next(
                (
                    g
                    for g in self._games.values()
                    if g.bgg_collection_id is None and g.bgg_id == bgg_id
                ),
                None,
            )
        was_created = existing is None

        slug = self._slug_for(existing, name)
        game = Game(
            id=existing.id if existing else self._next_id,
            bgg_id=bgg_id,
            bgg_collection_id=bgg_collection_id,
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
            min_age=min_age,
            primary_tag=primary_tag,
        )
        self._games[game.id] = game
        if was_created:
            self._next_id += 1
        return game, was_created

    def update_details(
        self,
        game_id: int,
        thumbnail_url: str,
        image_url: str,
        min_players: int,
        max_players: int,
        playing_time: int,
        bgg_rating: float,
        description: str = "",
        categories: tuple[str, ...] = (),
    ) -> Game:
        game = self._games[game_id]
        updated = dataclasses.replace(
            game,
            thumbnail_url=thumbnail_url,
            image_url=image_url,
            min_players=min_players,
            max_players=max_players,
            playing_time=playing_time,
            bgg_rating=bgg_rating,
            description=description,
            categories=categories,
            updated_at=datetime.now(UTC),
        )
        self._games[game_id] = updated
        return updated


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
