from __future__ import annotations

import sqlite3
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.api.app import create_app
from backend.api.auth import create_jwt
from backend.api.dependencies import _settings, get_db_conn
from backend.data.bgg_client import BggGame
from backend.data.repositories.sqlite_game_repository import SqliteGameRepository
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
from backend.domain.entities.member import Member
from backend.migrations.runner import run_migrations


def _setup_client() -> tuple[TestClient, sqlite3.Connection]:
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.execute("PRAGMA foreign_keys = ON")
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
    member_repo: SqliteMemberRepository, *, is_admin: bool
) -> Member:
    return member_repo.upsert_by_email(
        member_number=1,
        first_name="Ada",
        last_name="Admin",
        nickname=None,
        phone=None,
        email="ada@example.com",
        display_name="Ada Admin",
        is_admin=is_admin,
    )


class TestBggStatus:
    def test_requires_admin(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        member = _make_member(member_repo, is_admin=False)

        response = client.get("/api/admin/bgg/status", headers=_auth_cookie(member))

        assert response.status_code == 403
        conn.close()

    def test_no_games_imported_yet(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        member = _make_member(member_repo, is_admin=True)

        response = client.get("/api/admin/bgg/status", headers=_auth_cookie(member))

        assert response.status_code == 200
        assert response.json() == {"last_imported_at": None}
        conn.close()

    def test_reflects_most_recent_game_update(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        game_repo = SqliteGameRepository(conn)
        member = _make_member(member_repo, is_admin=True)
        game_repo.upsert_by_bgg_id(13, "Catan", "https://c.jpg", year_published=1995)

        response = client.get("/api/admin/bgg/status", headers=_auth_cookie(member))

        assert response.status_code == 200
        assert response.json()["last_imported_at"] is not None
        conn.close()


class TestBggImport:
    def test_requires_admin(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        member = _make_member(member_repo, is_admin=False)

        response = client.post("/api/admin/bgg/import", headers=_auth_cookie(member))

        assert response.status_code == 403
        conn.close()

    def test_imports_owned_games_and_reports_counts(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        member = _make_member(member_repo, is_admin=True)

        with patch(
            "backend.api.routes.bgg.BggClient.fetch_owned_games",
            return_value=[
                BggGame(13, "Catan", "https://c.jpg", 1995),
                BggGame(230802, "Azul", "https://a.jpg", 2017),
            ],
        ):
            response = client.post("/api/admin/bgg/import", headers=_auth_cookie(member))

        assert response.status_code == 200
        body = response.json()
        assert body["created"] == 2
        assert body["updated"] == 0
        assert body["total"] == 2
        assert body["last_imported_at"] is not None
        conn.close()
