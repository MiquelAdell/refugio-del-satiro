from __future__ import annotations

import sqlite3

from fastapi.testclient import TestClient

from backend.api.app import create_app
from backend.api.dependencies import get_db_conn
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
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


class TestForgotPassword:
    def test_returns_ok_for_existing_email(self) -> None:
        client, conn = _setup_test_client()
        member_repo = SqliteMemberRepository(conn)
        member_repo.upsert_by_email(1, "Test", "User", None, None, "test@test.com", "Test User", False)

        response = client.post("/api/forgot-password", json={"email": "test@test.com"})

        assert response.status_code == 200
        assert response.json() == {"ok": True}

    def test_returns_ok_for_nonexistent_email(self) -> None:
        client, _ = _setup_test_client()

        response = client.post("/api/forgot-password", json={"email": "nobody@test.com"})

        assert response.status_code == 200
        assert response.json() == {"ok": True}

    def test_returns_ok_for_inactive_member(self) -> None:
        client, conn = _setup_test_client()
        member_repo = SqliteMemberRepository(conn)
        member = member_repo.upsert_by_email(1, "Test", "User", None, None, "test@test.com", "Test User", False)
        member_repo.set_active(member.id, False)

        response = client.post("/api/forgot-password", json={"email": "test@test.com"})

        assert response.status_code == 200
        assert response.json() == {"ok": True}

    def test_creates_token_for_existing_email(self) -> None:
        client, conn = _setup_test_client()
        member_repo = SqliteMemberRepository(conn)
        member_repo.upsert_by_email(1, "Test", "User", None, None, "test@test.com", "Test User", False)

        client.post("/api/forgot-password", json={"email": "test@test.com"})

        row = conn.execute("SELECT COUNT(*) FROM password_tokens").fetchone()
        assert row[0] == 1

    def test_does_not_create_token_for_nonexistent_email(self) -> None:
        client, conn = _setup_test_client()

        client.post("/api/forgot-password", json={"email": "nobody@test.com"})

        row = conn.execute("SELECT COUNT(*) FROM password_tokens").fetchone()
        assert row[0] == 0
