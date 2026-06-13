from __future__ import annotations

import sqlite3

from fastapi.testclient import TestClient

from backend.api.app import create_app
from backend.api.auth import create_jwt
from backend.api.dependencies import _settings, get_db_conn
from backend.data.repositories.sqlite_game_repository import SqliteGameRepository
from backend.data.repositories.sqlite_loan_repository import SqliteLoanRepository
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
from backend.domain.entities.member import Member
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


def _auth_cookie(member: Member) -> dict[str, str]:
    token = create_jwt(member.id, _settings.jwt_secret)
    return {"Cookie": f"session_token={token}"}


def _make_member(
    member_repo: SqliteMemberRepository,
    *,
    number: int,
    first_name: str,
    last_name: str,
    email: str,
    is_admin: bool = False,
) -> Member:
    return member_repo.upsert_by_email(
        member_number=number,
        first_name=first_name,
        last_name=last_name,
        nickname=None,
        phone=None,
        email=email,
        display_name=f"{first_name} {last_name}",
        is_admin=is_admin,
    )


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
        assert item["status"] == "available"
        assert item["borrower_display_name"] is None
        assert item["loan_id"] is None
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

    def test_anonymous_request_hides_borrower_identity(self) -> None:
        client, conn = _setup_client()
        game_repo = SqliteGameRepository(conn)
        member_repo = SqliteMemberRepository(conn)
        loan_repo = SqliteLoanRepository(conn)

        rpg = game_repo.upsert_by_bgg_id(
            bgg_id=RPG_BGG_ID,
            name="Shadowrun",
            thumbnail_url="https://example.com/sr.jpg",
            item_type="rpgitem",
        )
        alice = _make_member(
            member_repo,
            number=1,
            first_name="Alice",
            last_name="Smith",
            email="alice@example.com",
        )
        loan_repo.create(game_id=rpg.id, member_id=alice.id)

        response = client.get("/api/rol")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        item = data[0]
        assert item["status"] == "lent"
        assert item["borrower_display_name"] is None
        assert item["loan_id"] is None
        conn.close()

    def test_authenticated_request_exposes_borrower_identity(self) -> None:
        client, conn = _setup_client()
        game_repo = SqliteGameRepository(conn)
        member_repo = SqliteMemberRepository(conn)
        loan_repo = SqliteLoanRepository(conn)

        rpg = game_repo.upsert_by_bgg_id(
            bgg_id=RPG_BGG_ID,
            name="Shadowrun",
            thumbnail_url="https://example.com/sr.jpg",
            item_type="rpgitem",
        )
        alice = _make_member(
            member_repo,
            number=1,
            first_name="Alice",
            last_name="Smith",
            email="alice@example.com",
        )
        bob = _make_member(
            member_repo,
            number=2,
            first_name="Bob",
            last_name="Jones",
            email="bob@example.com",
        )
        loan = loan_repo.create(game_id=rpg.id, member_id=alice.id)

        response = client.get("/api/rol", headers=_auth_cookie(bob))

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        item = data[0]
        assert item["status"] == "lent"
        assert item["borrower_display_name"] == "Alice Smith"
        assert item["loan_id"] == loan.id
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

    def test_rpg_slug_returns_item_with_status(self) -> None:
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
        assert data["status"] == "available"
        assert data["borrower_display_name"] is None
        assert data["loan_id"] is None
        conn.close()

    def test_lent_item_anonymous_hides_borrower(self) -> None:
        client, conn = _setup_client()
        game_repo = SqliteGameRepository(conn)
        member_repo = SqliteMemberRepository(conn)
        loan_repo = SqliteLoanRepository(conn)

        rpg = game_repo.upsert_by_bgg_id(
            bgg_id=RPG_BGG_ID,
            name="Shadowrun",
            thumbnail_url="https://example.com/sr.jpg",
            item_type="rpgitem",
        )
        alice = _make_member(
            member_repo,
            number=1,
            first_name="Alice",
            last_name="Smith",
            email="alice@example.com",
        )
        loan_repo.create(game_id=rpg.id, member_id=alice.id)

        response = client.get(f"/api/rol/{rpg.slug}")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "lent"
        assert data["borrower_display_name"] is None
        assert data["loan_id"] is None
        conn.close()

    def test_lent_item_authenticated_exposes_borrower(self) -> None:
        client, conn = _setup_client()
        game_repo = SqliteGameRepository(conn)
        member_repo = SqliteMemberRepository(conn)
        loan_repo = SqliteLoanRepository(conn)

        rpg = game_repo.upsert_by_bgg_id(
            bgg_id=RPG_BGG_ID,
            name="Shadowrun",
            thumbnail_url="https://example.com/sr.jpg",
            item_type="rpgitem",
        )
        alice = _make_member(
            member_repo,
            number=1,
            first_name="Alice",
            last_name="Smith",
            email="alice@example.com",
        )
        bob = _make_member(
            member_repo,
            number=2,
            first_name="Bob",
            last_name="Jones",
            email="bob@example.com",
        )
        loan = loan_repo.create(game_id=rpg.id, member_id=alice.id)

        response = client.get(f"/api/rol/{rpg.slug}", headers=_auth_cookie(bob))

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "lent"
        assert data["borrower_display_name"] == "Alice Smith"
        assert data["loan_id"] == loan.id
        conn.close()


class TestRpgItemHistory:
    def test_unknown_slug_returns_404(self) -> None:
        client, conn = _setup_client()

        response = client.get("/api/rol/no-existe/history")

        assert response.status_code == 404
        assert response.json() == {"detail": NOT_FOUND_DETAIL}
        conn.close()

    def test_never_lent_item_returns_empty_list(self) -> None:
        client, conn = _setup_client()
        game_repo = SqliteGameRepository(conn)

        rpg = game_repo.upsert_by_bgg_id(
            bgg_id=RPG_BGG_ID,
            name="Call of Cthulhu",
            thumbnail_url="https://example.com/coc.jpg",
            item_type="rpgitem",
        )

        response = client.get(f"/api/rol/{rpg.slug}/history")

        assert response.status_code == 200
        assert response.json() == []
        conn.close()

    def test_history_returns_entry_after_borrow_and_return(self) -> None:
        client, conn = _setup_client()
        game_repo = SqliteGameRepository(conn)
        member_repo = SqliteMemberRepository(conn)
        loan_repo = SqliteLoanRepository(conn)

        rpg = game_repo.upsert_by_bgg_id(
            bgg_id=RPG_BGG_ID,
            name="Call of Cthulhu",
            thumbnail_url="https://example.com/coc.jpg",
            item_type="rpgitem",
        )
        alice = _make_member(
            member_repo,
            number=1,
            first_name="Alice",
            last_name="Smith",
            email="alice@example.com",
        )
        loan = loan_repo.create(game_id=rpg.id, member_id=alice.id)
        loan_repo.mark_returned(loan.id)

        response = client.get(f"/api/rol/{rpg.slug}/history", headers=_auth_cookie(alice))

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["member_display_name"] == "Alice Smith"
        assert data[0]["returned_at"] is not None
        conn.close()

    def test_anonymous_history_hides_member_names(self) -> None:
        client, conn = _setup_client()
        game_repo = SqliteGameRepository(conn)
        member_repo = SqliteMemberRepository(conn)
        loan_repo = SqliteLoanRepository(conn)

        rpg = game_repo.upsert_by_bgg_id(
            bgg_id=RPG_BGG_ID,
            name="Call of Cthulhu",
            thumbnail_url="https://example.com/coc.jpg",
            item_type="rpgitem",
        )
        alice = _make_member(
            member_repo,
            number=1,
            first_name="Alice",
            last_name="Smith",
            email="alice@example.com",
        )
        loan = loan_repo.create(game_id=rpg.id, member_id=alice.id)
        loan_repo.mark_returned(loan.id)

        response = client.get(f"/api/rol/{rpg.slug}/history")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["member_display_name"] is None
        assert data[0]["returned_at"] is not None
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

    def test_borrowing_rpg_item_via_api_succeeds(self) -> None:
        client, conn = _setup_client()
        game_repo = SqliteGameRepository(conn)
        member_repo = SqliteMemberRepository(conn)

        rpg = game_repo.upsert_by_bgg_id(
            bgg_id=RPG_BGG_ID,
            name="Vampire the Masquerade",
            thumbnail_url="https://example.com/vtm.jpg",
            item_type="rpgitem",
        )
        alice = _make_member(
            member_repo,
            number=1,
            first_name="Alice",
            last_name="Smith",
            email="alice@example.com",
        )

        response = client.post(
            "/api/loans",
            json={"game_id": rpg.id},
            headers=_auth_cookie(alice),
        )

        assert response.status_code == 201
        data = response.json()
        assert data["game_id"] == rpg.id
        assert data["member_id"] == alice.id
        assert data["returned_at"] is None
        conn.close()
