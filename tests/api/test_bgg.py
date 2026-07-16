from __future__ import annotations

import sqlite3
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.api.app import create_app
from backend.api.auth import create_jwt
from backend.api.dependencies import _settings, get_db_conn
from backend.data.bgg_client import BggGame, BggRpgItem
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


def _make_member(member_repo: SqliteMemberRepository, *, is_admin: bool) -> Member:
    return member_repo.upsert_by_email(
        member_number=1,
        first_name="Ada",
        last_name="Admin",
        nickname=None,
        phone=None,
        email="TEST_email@domain.com",
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

    def test_imports_owned_games_and_rpg_items_and_reports_counts(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        game_repo = SqliteGameRepository(conn)
        member = _make_member(member_repo, is_admin=True)

        with (
            patch(
                "backend.api.routes.bgg.BggClient.fetch_owned_games",
                return_value=[
                    BggGame(13, "Catan", "https://c.jpg", 1995),
                    BggGame(230802, "Azul", "https://a.jpg", 2017),
                ],
            ),
            patch(
                "backend.api.routes.bgg.BggClient.fetch_owned_rpg_items",
                return_value=[
                    BggRpgItem(
                        bgg_id=1001,
                        name="D&D Player's Handbook",
                        thumbnail_url="https://dnd-thumb.jpg",
                        image_url="https://dnd.jpg",
                        year_published=2014,
                        bgg_rating=8.2,
                        description="Core rules",
                    )
                ],
            ),
        ):
            response = client.post(
                "/api/admin/bgg/import", headers=_auth_cookie(member)
            )

        assert response.status_code == 200
        body = response.json()
        assert set(body) == {"boardgames", "rpg_items", "last_imported_at"}
        assert body["boardgames"] == {
            "result": {
                "created": 2,
                "updated": 0,
                "total": 2,
                "deleted": 0,
                "deactivated": 0,
                "skip_reason": None,
            },
            "error": None,
        }
        assert body["rpg_items"] == {
            "result": {
                "created": 1,
                "updated": 0,
                "total": 1,
                "deleted": 0,
                "deactivated": 0,
                "skip_reason": None,
            },
            "error": None,
        }
        assert body["last_imported_at"] is not None
        boardgame = game_repo.get_by_bgg_id(13)
        rpg_item = game_repo.get_by_bgg_id(1001)
        assert boardgame is not None
        assert boardgame.item_type == "boardgame"
        assert rpg_item is not None
        assert rpg_item.item_type == "rpgitem"
        conn.close()

    def test_preserves_boardgame_result_when_rpg_import_fails(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        game_repo = SqliteGameRepository(conn)
        member = _make_member(member_repo, is_admin=True)

        with (
            patch(
                "backend.api.routes.bgg.BggClient.fetch_owned_games",
                return_value=[BggGame(13, "Catan", "https://c.jpg", 1995)],
            ) as fetch_owned_games,
            patch(
                "backend.api.routes.bgg.BggClient.fetch_owned_rpg_items",
                side_effect=RuntimeError("upstream secret details"),
            ) as fetch_owned_rpg_items,
        ):
            response = client.post(
                "/api/admin/bgg/import", headers=_auth_cookie(member)
            )

        assert response.status_code == 200
        assert response.json()["boardgames"] == {
            "result": {
                "created": 1,
                "updated": 0,
                "total": 1,
                "deleted": 0,
                "deactivated": 0,
                "skip_reason": None,
            },
            "error": None,
        }
        assert response.json()["rpg_items"] == {
            "result": None,
            "error": "No se han podido sincronizar los juegos de rol.",
        }
        fetch_owned_games.assert_called_once_with()
        fetch_owned_rpg_items.assert_called_once_with()
        persisted_game = game_repo.get_by_bgg_id(13)
        assert persisted_game is not None
        assert persisted_game.item_type == "boardgame"
        conn.close()
