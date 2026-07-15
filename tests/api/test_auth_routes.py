from __future__ import annotations

import sqlite3

from fastapi.testclient import TestClient

from backend.api.app import create_app
from backend.api.auth import hash_password
from backend.api.dependencies import get_db_conn
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
from backend.data.repositories.sqlite_password_token_repository import (
    SqlitePasswordTokenRepository,
)
from backend.migrations.runner import run_migrations


def _setup_test_client() -> tuple[TestClient, sqlite3.Connection]:
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    run_migrations(conn)

    def override_db_conn() -> sqlite3.Connection:  # type: ignore[misc]
        yield conn

    app = create_app()
    app.dependency_overrides[get_db_conn] = override_db_conn

    client = TestClient(app)
    return client, conn


class TestLogin:
    def test_login_success(self) -> None:
        client, conn = _setup_test_client()
        member_repo = SqliteMemberRepository(conn)
        member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )
        member_repo.set_password_hash(
            member_repo.get_by_email("TEST_email@domain.com").id,  # type: ignore[union-attr]
            hash_password("mypassword"),
        )

        response = client.post(
            "/api/login", json={"email": "TEST_email@domain.com", "password": "mypassword"}
        )
        assert response.status_code == 200
        assert response.json() == {"ok": True}
        assert "session_token" in response.cookies

    def test_login_wrong_password(self) -> None:
        client, conn = _setup_test_client()
        member_repo = SqliteMemberRepository(conn)
        member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )
        member_repo.set_password_hash(
            member_repo.get_by_email("TEST_email@domain.com").id,  # type: ignore[union-attr]
            hash_password("mypassword"),
        )

        response = client.post(
            "/api/login", json={"email": "TEST_email@domain.com", "password": "wrong"}
        )
        assert response.status_code == 401

    def test_login_nonexistent_email(self) -> None:
        client, _ = _setup_test_client()
        response = client.post(
            "/api/login", json={"email": "TEST_email@domain.com", "password": "test"}
        )
        assert response.status_code == 401

    def test_login_no_password_set(self) -> None:
        client, conn = _setup_test_client()
        member_repo = SqliteMemberRepository(conn)
        member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )

        response = client.post(
            "/api/login", json={"email": "TEST_email@domain.com", "password": "anything"}
        )
        assert response.status_code == 401


class TestLogout:
    def test_logout_clears_cookie(self) -> None:
        client, _ = _setup_test_client()
        response = client.post("/api/logout")
        assert response.status_code == 200
        assert response.json() == {"ok": True}


class TestGetMe:
    def test_get_me_authenticated(self) -> None:
        client, conn = _setup_test_client()
        member_repo = SqliteMemberRepository(conn)
        member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", True
        )
        member_repo.set_password_hash(
            member_repo.get_by_email("TEST_email@domain.com").id,  # type: ignore[union-attr]
            hash_password("mypassword"),
        )

        # Create JWT directly for the /me request
        from backend.api.auth import create_jwt
        from backend.api.dependencies import _settings

        member = member_repo.get_by_email("TEST_email@domain.com")
        assert member is not None
        token = create_jwt(member.id, _settings.jwt_secret)

        response = client.get("/api/me", headers={"Cookie": f"session_token={token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["display_name"] == "Test User"
        assert data["email"] == "TEST_email@domain.com"
        assert data["is_admin"] is True

    def test_get_me_unauthenticated(self) -> None:
        client, _ = _setup_test_client()
        response = client.get("/api/me")
        assert response.status_code == 401


class TestChangePassword:
    def _login_cookie(self, member_repo: SqliteMemberRepository, member_id: int) -> dict[str, str]:
        from backend.api.auth import create_jwt
        from backend.api.dependencies import _settings

        token = create_jwt(member_id, _settings.jwt_secret)
        return {"Cookie": f"session_token={token}"}

    def test_change_password_success(self) -> None:
        client, conn = _setup_test_client()
        member_repo = SqliteMemberRepository(conn)
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )
        member_repo.set_password_hash(member.id, hash_password("oldpassword"))

        response = client.post(
            "/api/change-password",
            json={"current_password": "oldpassword", "new_password": "newpassword"},
            headers=self._login_cookie(member_repo, member.id),
        )
        assert response.status_code == 200

        login_response = client.post(
            "/api/login",
            json={"email": "TEST_email@domain.com", "password": "newpassword"},
        )
        assert login_response.status_code == 200

    def test_change_password_wrong_current_password(self) -> None:
        client, conn = _setup_test_client()
        member_repo = SqliteMemberRepository(conn)
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )
        member_repo.set_password_hash(member.id, hash_password("oldpassword"))

        response = client.post(
            "/api/change-password",
            json={"current_password": "wrongpassword", "new_password": "newpassword"},
            headers=self._login_cookie(member_repo, member.id),
        )
        assert response.status_code == 400

    def test_change_password_unauthenticated(self) -> None:
        client, _ = _setup_test_client()

        response = client.post(
            "/api/change-password",
            json={"current_password": "oldpassword", "new_password": "newpassword"},
        )
        assert response.status_code == 401


class TestSetPassword:
    def test_set_password_success(self) -> None:
        client, conn = _setup_test_client()
        member_repo = SqliteMemberRepository(conn)
        token_repo = SqlitePasswordTokenRepository(conn)
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )
        password_token = token_repo.create(member.id)

        response = client.post(
            "/api/set-password",
            json={
                "token": password_token.token,
                "password": "newpassword123",
            },
        )
        assert response.status_code == 200

        # Now login should work
        login_response = client.post(
            "/api/login",
            json={
                "email": "TEST_email@domain.com",
                "password": "newpassword123",
            },
        )
        assert login_response.status_code == 200

    def test_set_password_invalid_token(self) -> None:
        client, _ = _setup_test_client()
        response = client.post(
            "/api/set-password",
            json={
                "token": "nonexistent",
                "password": "newpassword",
            },
        )
        assert response.status_code == 400

    def test_set_password_used_token(self) -> None:
        client, conn = _setup_test_client()
        member_repo = SqliteMemberRepository(conn)
        token_repo = SqlitePasswordTokenRepository(conn)
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )
        password_token = token_repo.create(member.id)
        token_repo.mark_used(password_token.id)

        response = client.post(
            "/api/set-password",
            json={
                "token": password_token.token,
                "password": "newpassword",
            },
        )
        assert response.status_code == 400
