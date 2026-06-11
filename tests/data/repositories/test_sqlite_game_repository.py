from backend.data.repositories.sqlite_game_repository import SqliteGameRepository


class TestSqliteGameRepository:
    def test_upsert_creates_new_game(self, game_repo: SqliteGameRepository) -> None:
        game = game_repo.upsert_by_bgg_id(
            bgg_id=13,
            name="Catan",
            thumbnail_url="https://example.com/catan.jpg",
            year_published=1995,
        )
        assert game.bgg_id == 13
        assert game.name == "Catan"
        assert game.year_published == 1995

    def test_upsert_updates_existing_game(
        self, game_repo: SqliteGameRepository
    ) -> None:
        game_repo.upsert_by_bgg_id(13, "Catan", "https://old.jpg", 1995)
        updated = game_repo.upsert_by_bgg_id(
            13, "Catan: 25th Anniversary", "https://new.jpg", 1995
        )
        assert updated.name == "Catan: 25th Anniversary"
        assert updated.thumbnail_url == "https://new.jpg"

    def test_get_by_id(self, game_repo: SqliteGameRepository) -> None:
        created = game_repo.upsert_by_bgg_id(
            13, "Catan", "https://example.com/catan.jpg", 1995
        )
        found = game_repo.get_by_id(created.id)
        assert found is not None
        assert found.bgg_id == 13

    def test_get_by_id_not_found(self, game_repo: SqliteGameRepository) -> None:
        assert game_repo.get_by_id(999) is None

    def test_upsert_generates_slug_from_name(
        self, game_repo: SqliteGameRepository
    ) -> None:
        game = game_repo.upsert_by_bgg_id(
            13, "1,2,3! Now you see me...", "https://x.jpg", 2020
        )
        assert game.slug == "1-2-3-now-you-see-me"

    def test_upsert_assigns_unique_slug_when_names_collide(
        self, game_repo: SqliteGameRepository
    ) -> None:
        first = game_repo.upsert_by_bgg_id(13, "Catan", "https://a.jpg", 1995)
        second = game_repo.upsert_by_bgg_id(14, "Catan", "https://b.jpg", 1995)
        assert first.slug == "catan"
        assert second.slug == "catan-2"

    def test_upsert_keeps_slug_when_name_unchanged(
        self, game_repo: SqliteGameRepository
    ) -> None:
        first = game_repo.upsert_by_bgg_id(13, "Catan", "https://a.jpg", 1995)
        again = game_repo.upsert_by_bgg_id(13, "Catan", "https://b.jpg", 1995)
        assert again.slug == first.slug

    def test_get_by_slug(self, game_repo: SqliteGameRepository) -> None:
        game_repo.upsert_by_bgg_id(13, "Catan", "https://example.com/catan.jpg", 1995)
        found = game_repo.get_by_slug("catan")
        assert found is not None
        assert found.bgg_id == 13

    def test_get_by_slug_not_found(self, game_repo: SqliteGameRepository) -> None:
        assert game_repo.get_by_slug("no-existe") is None

    def test_get_by_bgg_id(self, game_repo: SqliteGameRepository) -> None:
        game_repo.upsert_by_bgg_id(13, "Catan", "https://example.com/catan.jpg", 1995)
        found = game_repo.get_by_bgg_id(13)
        assert found is not None
        assert found.name == "Catan"

    def test_list_all_sorted_by_name(self, game_repo: SqliteGameRepository) -> None:
        game_repo.upsert_by_bgg_id(1, "Zombicide", "https://z.jpg", 2012)
        game_repo.upsert_by_bgg_id(2, "Azul", "https://a.jpg", 2017)
        game_repo.upsert_by_bgg_id(3, "Catan", "https://c.jpg", 1995)
        games = game_repo.list_all()
        names = [g.name for g in games]
        assert names == ["Azul", "Catan", "Zombicide"]

    def test_upsert_defaults_to_boardgame_item_type(
        self, game_repo: SqliteGameRepository
    ) -> None:
        game = game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        assert game.item_type == "boardgame"

    def test_upsert_stores_rpgitem_type(self, game_repo: SqliteGameRepository) -> None:
        game = game_repo.upsert_by_bgg_id(
            1001,
            "D&D Player's Handbook",
            "https://dnd.jpg",
            2014,
            item_type="rpgitem",
            description="A guide for adventurers.",
        )
        assert game.item_type == "rpgitem"
        assert game.description == "A guide for adventurers."

    def test_list_by_type_excludes_other_types(
        self, game_repo: SqliteGameRepository
    ) -> None:
        game_repo.upsert_by_bgg_id(
            13, "Catan", "https://c.jpg", 1995, item_type="boardgame"
        )
        game_repo.upsert_by_bgg_id(
            1001, "D&D PHB", "https://dnd.jpg", 2014, item_type="rpgitem"
        )
        boardgames = game_repo.list_by_type("boardgame")
        rpg_items = game_repo.list_by_type("rpgitem")
        assert [g.bgg_id for g in boardgames] == [13]
        assert [g.bgg_id for g in rpg_items] == [1001]

    def test_list_by_type_boardgame_excludes_upserted_rpgitem(
        self, game_repo: SqliteGameRepository
    ) -> None:
        """list_by_type('boardgame') must not return an rpgitem."""
        game_repo.upsert_by_bgg_id(
            1001, "D&D PHB", "https://dnd.jpg", 2014, item_type="rpgitem"
        )
        boardgames = game_repo.list_by_type("boardgame")
        assert boardgames == []

    def test_boardgame_and_rpgitem_with_same_name_get_distinct_slugs(
        self, game_repo: SqliteGameRepository
    ) -> None:
        """A boardgame and an rpgitem with the same name must get distinct slugs."""
        boardgame = game_repo.upsert_by_bgg_id(
            100, "Aventura", "https://a.jpg", 2000, item_type="boardgame"
        )
        rpg = game_repo.upsert_by_bgg_id(
            200, "Aventura", "https://b.jpg", 2005, item_type="rpgitem"
        )
        assert boardgame.slug == "aventura"
        assert rpg.slug == "aventura-2"
