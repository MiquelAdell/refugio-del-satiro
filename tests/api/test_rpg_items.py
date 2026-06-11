from __future__ import annotations

import sqlite3

from fastapi.testclient import TestClient

from backend.api.app import create_app
from backend.api.dependencies import get_db_conn
from backend.data.repositories.sqlite_game_repository import SqliteGameRepository
from backend.data.repositories.sqlite_loan_repository import SqliteLoanRepository
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
from backend.migrations.runner import run_migrations

RPG_BGG_ID = 500
BOARDGAME_BGG_ID = 100
NOT_FOUND_DETAIL = "Libro no encontrado."


def _setup_client() -> tuple[TestClient, sqlite3.Connection]:
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.row_factory = sqlite3.Row
    run_migrations(conn)

    app = create_app()

    def override_db_conn():  # type: ignore[no-untyped-def]
        yield conn

    app.dependency_overrides[get_db_conn] = override_db_conn
    client = TestClient(app)
    return client, conn


class TestListRpgItems:
    def test_empty_catalog(self) -> None:
        client, conn = _setup_client()

        response = client.get("/api/rol")

        assert response.status_code == 200
        assert response.json() == []
        conn.close()

    def test_rpg_item_appears_with_exact_fields(self) -> None:
        client, conn = _setup_client()
        game_repo = SqliteGameRepository(conn)

        rpg = game_repo.upsert_by_bgg_id(
            bgg_id=RPG_BGG_ID,
            name="Dungeons & Dragons",
            thumbnail_url="https://example.com/dnd_thumb.jpg",
            image_url="https://example.com/dnd.jpg",
            year_published=1974,
            bgg_rating=8.5,
            description="The original tabletop RPG.",
            item_type="rpgitem",
        )

        response = client.get("/api/rol")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        item = data[0]
        assert item["id"] == rpg.id
        assert item["bgg_id"] == RPG_BGG_ID
        assert item["name"] == "Dungeons & Dragons"
        assert item["slug"] == rpg.slug
        assert item["thumbnail_url"] == "https://example.com/dnd_thumb.jpg"
        assert item["image_url"] == "https://example.com/dnd.jpg"
        assert item["year_published"] == 1974
        assert item["bgg_rating"] == 8.5
        assert item["description"] == "The original tabletop RPG."
        conn.close()

    def test_rpg_item_absent_from_juegos(self) -> None:
        client, conn = _setup_client()
        game_repo = SqliteGameRepository(conn)

        rpg = game_repo.upsert_by_bgg_id(
            bgg_id=RPG_BGG_ID,
            name="Pathfinder",
            thumbnail_url="https://example.com/pf.jpg",
            item_type="rpgitem",
        )

        response = client.get("/api/juegos")

        assert response.status_code == 200
        slugs = [g["slug"] for g in response.json()]
        assert rpg.slug not in slugs
        conn.close()

    def test_boardgame_absent_from_rol(self) -> None:
        client, conn = _setup_client()
        game_repo = SqliteGameRepository(conn)

        game_repo.upsert_by_bgg_id(
            bgg_id=BOARDGAME_BGG_ID,
            name="Catan",
            thumbnail_url="https://example.com/catan.jpg",
        )

        response = client.get("/api/rol")

        assert response.status_code == 200
        assert response.json() == []
        conn.close()

    def test_response_has_no_loan_fields(self) -> None:
        client, conn = _setup_client()
        game_repo = SqliteGameRepository(conn)

        game_repo.upsert_by_bgg_id(
            bgg_id=RPG_BGG_ID,
            name="Call of Cthulhu",
            thumbnail_url="https://example.com/coc.jpg",
            item_type="rpgitem",
        )

        response = client.get("/api/rol")

        assert response.status_code == 200
        item = response.json()[0]
        assert "status" not in item
        assert "borrower_display_name" not in item
        assert "loan_id" not in item
        assert "location" not in item
        assert "min_players" not in item
        assert "max_players" not in item
        assert "playing_time" not in item
        conn.close()


class TestGetRpgItem:
    def test_not_found_unknown_slug(self) -> None:
        client, conn = _setup_client()

        response = client.get("/api/rol/no-existe")

        assert response.status_code == 404
        assert response.json() == {"detail": NOT_FOUND_DETAIL}
        conn.close()

    def test_boardgame_slug_returns_404(self) -> None:
        client, conn = _setup_client()
        game_repo = SqliteGameRepository(conn)

        game = game_repo.upsert_by_bgg_id(
            bgg_id=BOARDGAME_BGG_ID,
            name="Catan",
            thumbnail_url="https://example.com/catan.jpg",
        )

        response = client.get(f"/api/rol/{game.slug}")

        assert response.status_code == 404
        assert response.json() == {"detail": NOT_FOUND_DETAIL}
        conn.close()

    def test_rpg_slug_returns_item(self) -> None:
        client, conn = _setup_client()
        game_repo = SqliteGameRepository(conn)

        rpg = game_repo.upsert_by_bgg_id(
            bgg_id=RPG_BGG_ID,
            name="Shadowrun",
            thumbnail_url="https://example.com/sr.jpg",
            image_url="https://example.com/sr_full.jpg",
            year_published=1989,
            bgg_rating=7.8,
            description="Cyberpunk meets fantasy.",
            item_type="rpgitem",
        )

        response = client.get(f"/api/rol/{rpg.slug}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == rpg.id
        assert data["name"] == "Shadowrun"
        assert data["slug"] == rpg.slug
        assert data["description"] == "Cyberpunk meets fantasy."
        conn.close()


class TestLendingGuards:
    def test_rpg_slug_returns_404_on_juegos(self) -> None:
        client, conn = _setup_client()
        game_repo = SqliteGameRepository(conn)

        rpg = game_repo.upsert_by_bgg_id(
            bgg_id=RPG_BGG_ID,
            name="Vampire the Masquerade",
            thumbnail_url="https://example.com/vtm.jpg",
            item_type="rpgitem",
        )

        response = client.get(f"/api/juegos/{rpg.slug}")

        assert response.status_code == 404
        assert response.json() == {"detail": "Juego no encontrado."}
        conn.close()

    def test_borrowing_rpg_item_is_rejected(self) -> None:
        client, conn = _setup_client()
        game_repo = SqliteGameRepository(conn)
        member_repo = SqliteMemberRepository(conn)
        loan_repo = SqliteLoanRepository(conn)

        rpg = game_repo.upsert_by_bgg_id(
            bgg_id=RPG_BGG_ID,
            name="Vampire the Masquerade",
            thumbnail_url="https://example.com/vtm.jpg",
            item_type="rpgitem",
        )
        member = member_repo.upsert_by_email(
            member_number=1,
            first_name="Alice",
            last_name="Smith",
            nickname=None,
            phone=None,
            email="alice@example.com",
            display_name="Alice Smith",
            is_admin=False,
        )

        from backend.domain.use_cases.borrow_game import (
            BorrowGameError,
            BorrowGameUseCase,
        )

        use_case = BorrowGameUseCase(game_repo, loan_repo)
        import pytest

        with pytest.raises(BorrowGameError, match="no es pot prestar"):
            use_case.execute(rpg.id, member.id)

        conn.close()
