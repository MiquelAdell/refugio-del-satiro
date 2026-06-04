from __future__ import annotations

import sqlite3

from fastapi.testclient import TestClient

from backend.api.app import create_app
from backend.api.auth import create_jwt
from backend.api.dependencies import _settings, get_db_conn
from backend.data.database import get_memory_connection
from backend.data.repositories.sqlite_game_repository import SqliteGameRepository
from backend.data.repositories.sqlite_loan_repository import SqliteLoanRepository
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
from backend.domain.entities.member import Member
from backend.migrations.runner import run_migrations


def _setup_client() -> tuple[TestClient, sqlite3.Connection]:
    conn = get_memory_connection()
    conn.close()
    # Re-open with check_same_thread=False so FastAPI's threadpool can use it
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


class TestListGames:
    def test_empty_catalog(self) -> None:
        client, conn = _setup_client()

        response = client.get("/api/juegos")

        assert response.status_code == 200
        assert response.json() == []
        conn.close()

    def test_anonymous_request_hides_borrower_identity(self) -> None:
        client, conn = _setup_client()

        game_repo = SqliteGameRepository(conn)
        member_repo = SqliteMemberRepository(conn)
        loan_repo = SqliteLoanRepository(conn)

        game_repo.upsert_by_bgg_id(
            bgg_id=100,
            name="Catan",
            thumbnail_url="https://example.com/catan.jpg",
            year_published=1995,
        )
        game2 = game_repo.upsert_by_bgg_id(
            bgg_id=200,
            name="Pandemic",
            thumbnail_url="https://example.com/pandemic.jpg",
            year_published=2008,
        )

        alice = _make_member(
            member_repo,
            number=1,
            first_name="Alice",
            last_name="Smith",
            email="alice@example.com",
        )
        loan_repo.create(game_id=game2.id, member_id=alice.id)

        response = client.get("/api/juegos")

        assert response.status_code == 200
        by_name = {g["name"]: g for g in response.json()}

        assert by_name["Catan"]["status"] == "available"
        assert by_name["Catan"]["borrower_display_name"] is None
        assert by_name["Catan"]["loan_id"] is None

        # Privacy rule: anonymous viewers see lent status but not who has it.
        assert by_name["Pandemic"]["status"] == "lent"
        assert by_name["Pandemic"]["borrower_display_name"] is None
        assert by_name["Pandemic"]["loan_id"] is None

        conn.close()

    def test_authenticated_request_exposes_borrower_identity(self) -> None:
        client, conn = _setup_client()

        game_repo = SqliteGameRepository(conn)
        member_repo = SqliteMemberRepository(conn)
        loan_repo = SqliteLoanRepository(conn)

        game_repo.upsert_by_bgg_id(
            bgg_id=100,
            name="Catan",
            thumbnail_url="https://example.com/catan.jpg",
            year_published=1995,
        )
        game2 = game_repo.upsert_by_bgg_id(
            bgg_id=200,
            name="Pandemic",
            thumbnail_url="https://example.com/pandemic.jpg",
            year_published=2008,
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

        loan = loan_repo.create(game_id=game2.id, member_id=alice.id)

        response = client.get("/api/juegos", headers=_auth_cookie(bob))

        assert response.status_code == 200
        by_name = {g["name"]: g for g in response.json()}

        assert by_name["Catan"]["borrower_display_name"] is None
        assert by_name["Catan"]["loan_id"] is None

        assert by_name["Pandemic"]["status"] == "lent"
        assert by_name["Pandemic"]["borrower_display_name"] == "Alice Smith"
        assert by_name["Pandemic"]["loan_id"] == loan.id

        conn.close()


class TestGetGame:
    def test_not_found(self) -> None:
        client, conn = _setup_client()

        response = client.get("/api/juegos/no-existe")

        assert response.status_code == 404
        assert response.json() == {"detail": "Juego no encontrado."}
        conn.close()

    def test_available_game(self) -> None:
        client, conn = _setup_client()
        game_repo = SqliteGameRepository(conn)

        game = game_repo.upsert_by_bgg_id(
            bgg_id=100,
            name="Catan",
            thumbnail_url="https://example.com/catan.jpg",
            year_published=1995,
        )

        response = client.get(f"/api/juegos/{game.slug}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == game.id
        assert data["slug"] == "catan"
        assert data["name"] == "Catan"
        assert data["status"] == "available"
        assert data["borrower_display_name"] is None
        assert data["loan_id"] is None
        conn.close()

    def test_lent_game_anonymous_hides_borrower(self) -> None:
        client, conn = _setup_client()
        game_repo = SqliteGameRepository(conn)
        member_repo = SqliteMemberRepository(conn)
        loan_repo = SqliteLoanRepository(conn)

        game = game_repo.upsert_by_bgg_id(
            bgg_id=100,
            name="Catan",
            thumbnail_url="https://example.com/catan.jpg",
            year_published=1995,
        )
        alice = _make_member(
            member_repo,
            number=1,
            first_name="Alice",
            last_name="Smith",
            email="alice@example.com",
        )
        loan_repo.create(game_id=game.id, member_id=alice.id)

        response = client.get(f"/api/juegos/{game.slug}")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "lent"
        assert data["borrower_display_name"] is None
        assert data["loan_id"] is None
        conn.close()

    def test_lent_game_authenticated_exposes_borrower(self) -> None:
        client, conn = _setup_client()
        game_repo = SqliteGameRepository(conn)
        member_repo = SqliteMemberRepository(conn)
        loan_repo = SqliteLoanRepository(conn)

        game = game_repo.upsert_by_bgg_id(
            bgg_id=100,
            name="Catan",
            thumbnail_url="https://example.com/catan.jpg",
            year_published=1995,
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
        loan = loan_repo.create(game_id=game.id, member_id=alice.id)

        response = client.get(f"/api/juegos/{game.slug}", headers=_auth_cookie(bob))

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "lent"
        assert data["borrower_display_name"] == "Alice Smith"
        assert data["loan_id"] == loan.id
        conn.close()


class TestGetGameHistory:
    def _seed_history(self, conn: sqlite3.Connection) -> tuple[str, Member]:
        game_repo = SqliteGameRepository(conn)
        member_repo = SqliteMemberRepository(conn)
        loan_repo = SqliteLoanRepository(conn)

        game = game_repo.upsert_by_bgg_id(
            bgg_id=100,
            name="Catan",
            thumbnail_url="https://example.com/catan.jpg",
            year_published=1995,
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

        loan1 = loan_repo.create(game_id=game.id, member_id=alice.id)
        loan_repo.mark_returned(loan1.id)
        loan_repo.create(game_id=game.id, member_id=bob.id)

        return game.slug, alice

    def test_unknown_slug_returns_404(self) -> None:
        client, conn = _setup_client()

        response = client.get("/api/juegos/no-existe/history")

        assert response.status_code == 404
        conn.close()

    def test_known_game_with_no_history_returns_empty_list(self) -> None:
        client, conn = _setup_client()

        game_repo = SqliteGameRepository(conn)
        game_repo.upsert_by_bgg_id(
            bgg_id=100,
            name="Catan",
            thumbnail_url="https://example.com/catan.jpg",
            year_published=1995,
        )

        response = client.get("/api/juegos/catan/history")

        assert response.status_code == 200
        assert response.json() == []
        conn.close()

    def test_anonymous_request_hides_history_member_names(self) -> None:
        client, conn = _setup_client()
        slug, _ = self._seed_history(conn)

        response = client.get(f"/api/juegos/{slug}/history")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

        # Names hidden, dates preserved.
        assert data[0]["member_display_name"] is None
        assert data[0]["returned_at"] is None
        assert data[1]["member_display_name"] is None
        assert data[1]["returned_at"] is not None

        conn.close()

    def test_authenticated_request_exposes_history_member_names(self) -> None:
        client, conn = _setup_client()
        slug, alice = self._seed_history(conn)

        response = client.get(
            f"/api/juegos/{slug}/history", headers=_auth_cookie(alice)
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

        # Most recent first
        assert data[0]["member_display_name"] == "Bob Jones"
        assert data[0]["returned_at"] is None

        assert data[1]["member_display_name"] == "Alice Smith"
        assert data[1]["returned_at"] is not None

        conn.close()
