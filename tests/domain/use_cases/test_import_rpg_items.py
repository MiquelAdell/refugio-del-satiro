from __future__ import annotations

from datetime import UTC, datetime

from backend.data.bgg_client import BggRpgItem
from backend.domain.entities.game import Game
from backend.domain.slug import ensure_unique, slugify
from backend.domain.use_cases.import_rpg_items import ImportRpgItemsUseCase


class FakeBggClientRpg:
    def __init__(self, items: list[BggRpgItem]) -> None:
        self._items = items

    def fetch_owned_rpg_items(self) -> list[BggRpgItem]:
        return self._items


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

    def list_by_type(self, item_type: str) -> list[Game]:
        return sorted(
            (g for g in self._games.values() if g.item_type == item_type),
            key=lambda g: g.name,
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
        location: str = "armari",
        item_type: str = "boardgame",
        description: str = "",
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
                id=existing.id,
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
                created_at=existing.created_at,
                updated_at=now,
                item_type=item_type,
                description=description,
            )
            self._games[game.id] = game
            return game
        game = Game(
            id=self._next_id,
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
            created_at=now,
            updated_at=now,
            item_type=item_type,
            description=description,
        )
        self._games[game.id] = game
        self._next_id += 1
        return game


_DND_RPG_ITEM = BggRpgItem(
    bgg_id=1001,
    name="Dungeons & Dragons Player's Handbook",
    thumbnail_url="https://cf.geekdo-images.com/dnd_t.png",
    image_url="https://cf.geekdo-images.com/dnd.png",
    year_published=2014,
    bgg_rating=8.5,
    description="A guide for adventurers.",
)
_PF_RPG_ITEM = BggRpgItem(
    bgg_id=1002,
    name="Pathfinder Core Rulebook",
    thumbnail_url="https://cf.geekdo-images.com/pf_t.png",
    image_url="https://cf.geekdo-images.com/pf.png",
    year_published=2019,
    bgg_rating=9.1,
    description="The complete Pathfinder rules.",
)


class TestImportRpgItemsUseCase:
    def test_imports_new_rpg_items(self) -> None:
        bgg_client = FakeBggClientRpg([_DND_RPG_ITEM, _PF_RPG_ITEM])
        repo = FakeGameRepository()
        use_case = ImportRpgItemsUseCase(repo, bgg_client)

        result = use_case.execute()

        assert result.created == 2
        assert result.updated == 0
        assert result.total == 2
        assert len(repo.list_all()) == 2

    def test_upserts_with_rpgitem_type(self) -> None:
        bgg_client = FakeBggClientRpg([_DND_RPG_ITEM])
        repo = FakeGameRepository()
        use_case = ImportRpgItemsUseCase(repo, bgg_client)

        use_case.execute()

        game = repo.get_by_bgg_id(1001)
        assert game is not None
        assert game.item_type == "rpgitem"

    def test_upserts_description(self) -> None:
        bgg_client = FakeBggClientRpg([_DND_RPG_ITEM])
        repo = FakeGameRepository()
        use_case = ImportRpgItemsUseCase(repo, bgg_client)

        use_case.execute()

        game = repo.get_by_bgg_id(1001)
        assert game is not None
        assert game.description == "A guide for adventurers."

    def test_updates_existing_rpg_item(self) -> None:
        repo = FakeGameRepository()
        repo.upsert_by_bgg_id(
            1001,
            "D&D PHB",
            "https://old.jpg",
            item_type="rpgitem",
        )
        bgg_client = FakeBggClientRpg([_DND_RPG_ITEM])
        use_case = ImportRpgItemsUseCase(repo, bgg_client)

        result = use_case.execute()

        assert result.created == 0
        assert result.updated == 1
        game = repo.get_by_bgg_id(1001)
        assert game is not None
        assert game.name == "Dungeons & Dragons Player's Handbook"

    def test_empty_collection(self) -> None:
        bgg_client = FakeBggClientRpg([])
        repo = FakeGameRepository()
        use_case = ImportRpgItemsUseCase(repo, bgg_client)

        result = use_case.execute()

        assert result.created == 0
        assert result.updated == 0
        assert result.total == 0
        assert repo.list_all() == []
