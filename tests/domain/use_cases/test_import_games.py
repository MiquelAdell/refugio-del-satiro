from __future__ import annotations

from datetime import UTC, datetime

from backend.data.bgg_client import BggGame
from backend.domain.entities.game import Game
from backend.domain.slug import ensure_unique, slugify
from backend.domain.use_cases.import_games import ImportGamesUseCase


class FakeBggClient:
    def __init__(self, games: list[BggGame]) -> None:
        self._games = games

    def fetch_owned_games(self) -> list[BggGame]:
        return self._games


class FakeGameRepository:
    def __init__(self) -> None:
        self._games: dict[int, Game] = {}
        self._next_id = 1

    def get_by_id(self, game_id: int) -> Game | None:
        return self._games.get(game_id)

    def get_by_slug(self, slug: str) -> Game | None:
        return next((g for g in self._games.values() if g.slug == slug), None)

    def get_by_bgg_id(self, bgg_id: int) -> Game | None:
        return next((g for g in self._games.values() if g.bgg_id == bgg_id), None)

    def list_all(self) -> list[Game]:
        return sorted(self._games.values(), key=lambda g: g.name)

    def upsert_by_bgg_id(
        self, bgg_id: int, name: str, thumbnail_url: str, image_url: str = "",
        year_published: int = 0,
        min_players: int = 0, max_players: int = 0, playing_time: int = 0,
        bgg_rating: float = 0.0, location: str = "armari",
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
        if existing:
            game = Game(
                id=existing.id, bgg_id=bgg_id, name=name, slug=slug,
                thumbnail_url=thumbnail_url, image_url=image_url,
                year_published=year_published,
                min_players=min_players, max_players=max_players,
                playing_time=playing_time, bgg_rating=bgg_rating, location=location,
                created_at=existing.created_at, updated_at=now,
            )
            self._games[game.id] = game
            return game
        game = Game(
            id=self._next_id, bgg_id=bgg_id, name=name, slug=slug,
            thumbnail_url=thumbnail_url, image_url=image_url,
            year_published=year_published,
            min_players=min_players, max_players=max_players,
            playing_time=playing_time, bgg_rating=bgg_rating, location=location,
            created_at=now, updated_at=now,
        )
        self._games[game.id] = game
        self._next_id += 1
        return game


class TestImportGamesUseCase:
    def test_imports_new_games(self) -> None:
        bgg_client = FakeBggClient([
            BggGame(13, "Catan", "https://c.jpg", 1995),
            BggGame(230802, "Azul", "https://a.jpg", 2017),
        ])
        repo = FakeGameRepository()
        use_case = ImportGamesUseCase(repo, bgg_client)
        result = use_case.execute()
        assert result.created == 2
        assert result.updated == 0
        assert result.total == 2
        assert len(repo.list_all()) == 2

    def test_updates_existing_games(self) -> None:
        repo = FakeGameRepository()
        repo.upsert_by_bgg_id(13, "Catan", "https://old.jpg", 1995)
        bgg_client = FakeBggClient([
            BggGame(13, "Catan: 25th Anniversary", "https://new.jpg", 1995),
        ])
        use_case = ImportGamesUseCase(repo, bgg_client)
        result = use_case.execute()
        assert result.created == 0
        assert result.updated == 1
        game = repo.get_by_bgg_id(13)
        assert game is not None
        assert game.name == "Catan: 25th Anniversary"

    def test_mixed_create_and_update(self) -> None:
        repo = FakeGameRepository()
        repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        bgg_client = FakeBggClient([
            BggGame(13, "Catan", "https://c.jpg", 1995),
            BggGame(230802, "Azul", "https://a.jpg", 2017),
        ])
        use_case = ImportGamesUseCase(repo, bgg_client)
        result = use_case.execute()
        assert result.created == 1
        assert result.updated == 1
        assert result.total == 2

    def test_empty_collection(self) -> None:
        bgg_client = FakeBggClient([])
        repo = FakeGameRepository()
        use_case = ImportGamesUseCase(repo, bgg_client)
        result = use_case.execute()
        assert result.created == 0
        assert result.updated == 0
        assert result.total == 0
