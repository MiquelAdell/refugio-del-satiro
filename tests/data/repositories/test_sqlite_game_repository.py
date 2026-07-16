import sqlite3

from backend.data.repositories.sqlite_game_repository import SqliteGameRepository
from backend.data.repositories.sqlite_loan_repository import SqliteLoanRepository
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository


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

    def test_upsert_normalizes_boardgame_categories(
        self, game_repo: SqliteGameRepository, db_conn: sqlite3.Connection
    ) -> None:
        game = game_repo.upsert_by_bgg_id(
            13,
            "Catan",
            "https://c.jpg",
            categories=(" Strategy ", "", "Family", "strategy", "  ", "Economic"),
        )

        assert game.categories == ("Economic", "Family", "Strategy")
        row = db_conn.execute(
            "SELECT categories_json FROM games WHERE bgg_id = 13"
        ).fetchone()
        assert row["categories_json"] == '["Economic", "Family", "Strategy"]'

    def test_upsert_normalizes_rpg_publication_types(
        self, game_repo: SqliteGameRepository
    ) -> None:
        game = game_repo.upsert_by_bgg_id(
            1001,
            "D&D Player's Handbook",
            "https://dnd.jpg",
            item_type="rpgitem",
            publication_types=(
                " Scenario / Adventure / Module ",
                "Core Rules",
                "core rules",
                "",
            ),
        )

        assert game.publication_types == (
            "Core Rules",
            "Scenario / Adventure / Module",
        )

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

    def test_upsert_defaults_is_active_true(
        self, game_repo: SqliteGameRepository
    ) -> None:
        game = game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        assert game.is_active is True

    def test_list_by_type_excludes_inactive(
        self, game_repo: SqliteGameRepository
    ) -> None:
        game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        game_repo.deactivate_by_bgg_ids([13])
        assert game_repo.list_by_type("boardgame") == []

    def test_list_by_type_including_inactive_includes_it(
        self, game_repo: SqliteGameRepository
    ) -> None:
        game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        game_repo.deactivate_by_bgg_ids([13])
        games = game_repo.list_by_type_including_inactive("boardgame")
        assert [g.bgg_id for g in games] == [13]
        assert games[0].is_active is False

    def test_deactivate_by_bgg_ids_marks_inactive_and_returns_count(
        self, game_repo: SqliteGameRepository
    ) -> None:
        game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        game_repo.upsert_by_bgg_id(14, "Azul", "https://a.jpg", 2017)
        count = game_repo.deactivate_by_bgg_ids([13, 14])
        assert count == 2
        assert game_repo.get_by_bgg_id(13).is_active is False
        assert game_repo.get_by_bgg_id(14).is_active is False

    def test_deactivate_by_bgg_ids_no_ops_on_empty_input(
        self, game_repo: SqliteGameRepository
    ) -> None:
        assert game_repo.deactivate_by_bgg_ids([]) == 0

    def test_delete_by_bgg_ids_removes_never_borrowed_game(
        self, game_repo: SqliteGameRepository
    ) -> None:
        game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        deleted, blocked = game_repo.delete_by_bgg_ids([13])
        assert deleted == frozenset({13})
        assert blocked == frozenset()
        assert game_repo.get_by_bgg_id(13) is None

    def test_upsert_reactivates_previously_inactive_row(
        self, game_repo: SqliteGameRepository
    ) -> None:
        game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        game_repo.deactivate_by_bgg_ids([13])
        reactivated = game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        assert reactivated.is_active is True

    def test_point_lookups_return_inactive_rows(
        self, game_repo: SqliteGameRepository
    ) -> None:
        game = game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        game_repo.deactivate_by_bgg_ids([13])
        assert game_repo.get_by_bgg_id(13) is not None
        assert game_repo.get_by_slug(game.slug) is not None

    def test_delete_blocked_by_returned_loan_history(
        self,
        game_repo: SqliteGameRepository,
        loan_repo: SqliteLoanRepository,
        member_repo: SqliteMemberRepository,
    ) -> None:
        """A game with past (returned) loan history can never be hard-deleted,
        because SQLite's FK constraint on loans.game_id doesn't distinguish
        active from historical loans."""
        game = game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", 1995)
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )
        loan = loan_repo.create(game.id, member.id)
        loan_repo.mark_returned(loan.id)

        deleted, blocked = game_repo.delete_by_bgg_ids([13])

        assert deleted == frozenset()
        assert blocked == frozenset({13})
        assert game_repo.get_by_bgg_id(13) is not None
