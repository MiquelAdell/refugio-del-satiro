from backend.data.database import get_memory_connection
from backend.migrations.runner import run_migrations


class TestMigrationRunner:
    def test_creates_schema_migrations_table(self) -> None:
        conn = get_memory_connection()
        run_migrations(conn)
        tables = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'"
        ).fetchall()
        assert len(tables) == 1
        conn.close()

    def test_applies_initial_migration(self) -> None:
        conn = get_memory_connection()
        applied = run_migrations(conn)
        assert "001_initial" in applied
        conn.close()

    def test_applies_item_type_migration(self) -> None:
        conn = get_memory_connection()
        applied = run_migrations(conn)
        assert "006_add_item_type" in applied
        conn.close()

    def test_applies_membership_validation_fields_migration(self) -> None:
        conn = get_memory_connection()
        applied = run_migrations(conn)
        assert "007_add_membership_validation_fields" in applied
        conn.close()

    def test_creates_all_tables(self) -> None:
        conn = get_memory_connection()
        run_migrations(conn)
        tables = {
            row[0]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        }
        assert "games" in tables
        assert "members" in tables
        assert "loans" in tables
        assert "password_tokens" in tables
        conn.close()

    def test_idempotent_on_rerun(self) -> None:
        conn = get_memory_connection()
        first_run = run_migrations(conn)
        second_run = run_migrations(conn)
        assert len(first_run) == 10
        assert len(second_run) == 0
        conn.close()

    def test_foreign_keys_enabled(self) -> None:
        conn = get_memory_connection()
        run_migrations(conn)
        result = conn.execute("PRAGMA foreign_keys").fetchone()
        assert result[0] == 1
        conn.close()

    def test_games_table_columns(self) -> None:
        conn = get_memory_connection()
        run_migrations(conn)
        columns = {
            row[1] for row in conn.execute("PRAGMA table_info(games)").fetchall()
        }
        assert columns == {
            "id",
            "bgg_id",
            "name",
            "slug",
            "thumbnail_url",
            "image_url",
            "year_published",
            "min_players",
            "max_players",
            "playing_time",
            "bgg_rating",
            "location",
            "created_at",
            "updated_at",
            "item_type",
            "description",
            "is_active",
            "bgg_collection_id",
            "categories_json",
            "publication_types_json",
        }
        conn.close()

    def test_bgg_id_is_no_longer_unique(self) -> None:
        """Migration 009 drops UNIQUE(bgg_id): BGG can list several distinct
        owned items under one bgg_id/objectid."""
        conn = get_memory_connection()
        run_migrations(conn)
        conn.execute(
            "INSERT INTO games (bgg_id, name, thumbnail_url, year_published) "
            "VALUES (268620, 'Similo: Mitos', 't1.jpg', 2020)"
        )
        conn.execute(
            "INSERT INTO games (bgg_id, name, thumbnail_url, year_published) "
            "VALUES (268620, 'Similo: Historia', 't2.jpg', 2020)"
        )
        conn.commit()
        count = conn.execute(
            "SELECT COUNT(*) FROM games WHERE bgg_id = 268620"
        ).fetchone()[0]
        assert count == 2
        conn.close()

    def test_bgg_collection_id_is_unique_when_set(self) -> None:
        import sqlite3

        conn = get_memory_connection()
        run_migrations(conn)
        conn.execute(
            "INSERT INTO games "
            "(bgg_id, bgg_collection_id, name, thumbnail_url, year_published) "
            "VALUES (1, 100, 'Catan', 't.jpg', 1995)"
        )
        conn.commit()
        try:
            conn.execute(
                "INSERT INTO games "
                "(bgg_id, bgg_collection_id, name, thumbnail_url, year_published) "
                "VALUES (2, 100, 'Other', 't.jpg', 2000)"
            )
            conn.commit()
            raise AssertionError("duplicate bgg_collection_id should be rejected")
        except sqlite3.IntegrityError:
            pass
        conn.close()

    def test_loans_fk_preserved_after_migration_009_rebuild(self) -> None:
        """The games table rebuild (dropping UNIQUE(bgg_id)) must not lose
        loans.game_id's ON DELETE RESTRICT foreign key."""
        import sqlite3

        conn = get_memory_connection()
        run_migrations(conn)
        conn.execute(
            "INSERT INTO games (bgg_id, name, thumbnail_url, year_published) "
            "VALUES (1, 'Catan', 't.jpg', 1995)"
        )
        conn.execute(
            "INSERT INTO members (email, display_name, first_name, last_name) "
            "VALUES ('a@b.com', 'A', 'A', 'B')"
        )
        conn.commit()
        game_id = conn.execute("SELECT id FROM games").fetchone()[0]
        member_id = conn.execute("SELECT id FROM members").fetchone()[0]
        conn.execute(
            "INSERT INTO loans (game_id, member_id) VALUES (?, ?)",
            (game_id, member_id),
        )
        conn.commit()
        try:
            conn.execute("DELETE FROM games WHERE id = ?", (game_id,))
            conn.commit()
            raise AssertionError("FK should have blocked this delete")
        except sqlite3.IntegrityError:
            pass
        conn.close()

    def test_games_item_type_index_created(self) -> None:
        conn = get_memory_connection()
        run_migrations(conn)
        indexes = {
            row[1] for row in conn.execute("PRAGMA index_list(games)").fetchall()
        }
        assert "idx_games_item_type" in indexes
        conn.close()

    def test_games_item_type_defaults_to_boardgame(self) -> None:
        conn = get_memory_connection()
        run_migrations(conn)
        conn.execute(
            "INSERT INTO games "
            "(bgg_id, name, thumbnail_url, year_published, created_at, updated_at) "
            "VALUES (99, 'Test', 'https://t.jpg', 2020, "
            "'2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z')"
        )
        row = conn.execute(
            "SELECT item_type, description FROM games WHERE bgg_id = 99"
        ).fetchone()
        assert row[0] == "boardgame"
        assert row[1] == ""
        conn.close()

    def test_members_table_columns(self) -> None:
        conn = get_memory_connection()
        run_migrations(conn)
        columns = {
            row[1] for row in conn.execute("PRAGMA table_info(members)").fetchall()
        }
        assert columns == {
            "id",
            "member_number",
            "first_name",
            "last_name",
            "nickname",
            "phone",
            "email",
            "display_name",
            "password_hash",
            "is_admin",
            "is_active",
            "created_at",
            "updated_at",
            "last_payment",
            "gender",
        }
        conn.close()

    def test_loans_table_columns(self) -> None:
        conn = get_memory_connection()
        run_migrations(conn)
        columns = {
            row[1] for row in conn.execute("PRAGMA table_info(loans)").fetchall()
        }
        assert columns == {
            "id",
            "game_id",
            "member_id",
            "borrowed_at",
            "returned_at",
        }
        conn.close()

    def test_partial_unique_index_on_active_loans(self) -> None:
        conn = get_memory_connection()
        run_migrations(conn)
        indexes = conn.execute("PRAGMA index_list(loans)").fetchall()
        index_names = {row[1] for row in indexes}
        assert "idx_loans_active_game" in index_names
        conn.close()
