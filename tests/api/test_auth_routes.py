from __future__ import annotations

import sqlite3

import pytest
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


def test_application_title_uses_refugio_del_satiro_brand() -> None:
    assert create_app().title == "Refugio del Sátiro"


class TestLogin:
    INVALID_CREDENTIALS_RESPONSE = {"detail": "Correo o contraseña incorrectos."}

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
            "/api/login",
            json={"email": "TEST_email@domain.com", "password": "mypassword"},
        )
        assert response.status_code == 200
        assert response.json() == {"ok": True}
        assert "session_token" in response.cookies

    def test_production_login_sets_secure_cookie(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("REFUGIO_SECURE_AUTH_COOKIE", "true")
        client, conn = _setup_test_client()
        member_repo = SqliteMemberRepository(conn)
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "secure@example.invalid", "Test User", False
        )
        member_repo.set_password_hash(member.id, hash_password("mypassword"))

        response = client.post(
            "/api/login",
            json={"email": "secure@example.invalid", "password": "mypassword"},
        )

        assert response.status_code == 200
        assert response.json() == {"ok": True}
        assert response.headers["set-cookie"].split("; ") == [
            f"session_token={response.cookies['session_token']}",
            "HttpOnly",
            "Max-Age=604800",
            "Path=/",
            "SameSite=lax",
            "Secure",
        ]

    def test_local_login_cookie_remains_usable_over_http(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("REFUGIO_SECURE_AUTH_COOKIE", "false")
        client, conn = _setup_test_client()
        member_repo = SqliteMemberRepository(conn)
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "local@example.invalid", "Test User", False
        )
        member_repo.set_password_hash(member.id, hash_password("mypassword"))

        login_response = client.post(
            "/api/login",
            json={"email": "local@example.invalid", "password": "mypassword"},
        )
        me_response = client.get("/api/me")

        assert login_response.status_code == 200
        assert "Secure" not in login_response.headers["set-cookie"]
        assert me_response.status_code == 200
        assert me_response.json() == {
            "id": member.id,
            "member_number": 1,
            "first_name": "Test",
            "last_name": "User",
            "nickname": None,
            "phone": None,
            "email": "local@example.invalid",
            "display_name": "Test User",
            "is_admin": False,
            "is_active": True,
            "last_payment": None,
        }

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
        assert response.json() == self.INVALID_CREDENTIALS_RESPONSE

    def test_login_nonexistent_email(self) -> None:
        client, _ = _setup_test_client()
        response = client.post(
            "/api/login", json={"email": "TEST_email@domain.com", "password": "test"}
        )
        assert response.status_code == 401
        assert response.json() == self.INVALID_CREDENTIALS_RESPONSE

    def test_login_no_password_set(self) -> None:
        client, conn = _setup_test_client()
        member_repo = SqliteMemberRepository(conn)
        member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )

        response = client.post(
            "/api/login",
            json={"email": "TEST_email@domain.com", "password": "anything"},
        )
        assert response.status_code == 401
        assert response.json() == self.INVALID_CREDENTIALS_RESPONSE

    def test_login_inactive_member(self) -> None:
        client, conn = _setup_test_client()
        member_repo = SqliteMemberRepository(conn)
        member = member_repo.upsert_by_email(
            1,
            "Test",
            "User",
            None,
            None,
            "TEST_email@domain.com",
            "Test User",
            False,
            is_active=False,
        )
        member_repo.set_password_hash(member.id, hash_password("mypassword"))

        response = client.post(
            "/api/login",
            json={"email": "TEST_email@domain.com", "password": "mypassword"},
        )

        assert response.status_code == 401
        assert response.json() == self.INVALID_CREDENTIALS_RESPONSE


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
        member = member_repo.upsert_by_email(
            42,
            "Ada",
            "Lovelace",
            "Enchantress of Numbers",
            "+34 600 123 456",
            "ada@example.invalid",
            "Ada Lovelace",
            True,
            last_payment="2026-06-30",
            gender="female",
        )
        member_repo.set_password_hash(member.id, hash_password("mypassword"))

        # Create JWT directly for the /me request
        from backend.api.auth import create_jwt
        from backend.api.dependencies import _settings

        token = create_jwt(member.id, _settings.jwt_secret)

        response = client.get("/api/me", headers={"Cookie": f"session_token={token}"})

        assert response.status_code == 200
        assert response.json() == {
            "id": member.id,
            "member_number": 42,
            "first_name": "Ada",
            "last_name": "Lovelace",
            "nickname": "Enchantress of Numbers",
            "phone": "+34 600 123 456",
            "email": "ada@example.invalid",
            "display_name": "Ada Lovelace",
            "is_admin": True,
            "is_active": True,
            "last_payment": "2026-06-30",
        }
        assert {
            "password_hash",
            "created_at",
            "updated_at",
            "gender",
        }.isdisjoint(response.json())

    def test_get_me_preserves_nullable_profile_fields(self) -> None:
        client, conn = _setup_test_client()
        member_repo = SqliteMemberRepository(conn)
        member = member_repo.upsert_by_email(
            None,
            "Grace",
            "Hopper",
            None,
            None,
            "grace@example.invalid",
            "Grace Hopper",
            False,
            last_payment=None,
        )

        from backend.api.auth import create_jwt
        from backend.api.dependencies import _settings

        token = create_jwt(member.id, _settings.jwt_secret)

        response = client.get("/api/me", headers={"Cookie": f"session_token={token}"})

        assert response.status_code == 200
        assert response.json() == {
            "id": member.id,
            "member_number": None,
            "first_name": "Grace",
            "last_name": "Hopper",
            "nickname": None,
            "phone": None,
            "email": "grace@example.invalid",
            "display_name": "Grace Hopper",
            "is_admin": False,
            "is_active": True,
            "last_payment": None,
        }

    def test_get_me_unauthenticated(self) -> None:
        client, _ = _setup_test_client()

        response = client.get("/api/me")

        assert response.status_code == 401
        assert response.json() == {"detail": "Es necesario iniciar sesión."}


class TestChangePassword:
    def _login_cookie(
        self, member_repo: SqliteMemberRepository, member_id: int
    ) -> dict[str, str]:
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
