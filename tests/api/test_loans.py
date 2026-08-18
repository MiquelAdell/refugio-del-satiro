from __future__ import annotations

import sqlite3

import pytest
from fastapi.testclient import TestClient

from backend.api.app import create_app
from backend.api.auth import create_jwt
from backend.api.dependencies import (
    _settings,
    get_db_conn,
    get_game_repo,
    get_loan_return_notifier,
    get_member_repo,
)
from backend.data.repositories.sqlite_game_repository import SqliteGameRepository
from backend.data.repositories.sqlite_loan_repository import SqliteLoanRepository
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
from backend.domain.entities.game import Game
from backend.domain.entities.member import Member
from backend.migrations.runner import run_migrations


class FakeNotifier:
    def __init__(self, result: bool) -> None:
        self.result = result
        self.calls: list[tuple[str, str, str]] = []

    def send_forced_return(
        self, to_email: str, display_name: str, item_name: str
    ) -> bool:
        self.calls.append((to_email, display_name, item_name))
        return self.result


class RaisingGameRepository(SqliteGameRepository):
    def get_by_id(self, game_id: int) -> Game | None:
        raise RuntimeError("game lookup")


class RaisingBorrowerMemberRepository(SqliteMemberRepository):
    def __init__(self, conn: sqlite3.Connection, borrower_id: int) -> None:
        super().__init__(conn)
        self._borrower_id = borrower_id

    def get_by_id(self, member_id: int) -> Member | None:
        if member_id == self._borrower_id:
            raise RuntimeError("member lookup")
        return super().get_by_id(member_id)


def _setup_client(
    notifier: FakeNotifier | None = None,
) -> tuple[TestClient, sqlite3.Connection]:
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    run_migrations(conn)
    app = create_app()

    def override_db_conn():  # type: ignore[no-untyped-def]
        yield conn

    app.dependency_overrides[get_db_conn] = override_db_conn
    if notifier is not None:
        app.dependency_overrides[get_loan_return_notifier] = lambda: notifier
    return TestClient(app), conn


def _member(
    repo: SqliteMemberRepository,
    number: int,
    *,
    is_admin: bool = False,
) -> Member:
    return repo.upsert_by_email(
        number,
        f"Member {number}",
        "User",
        None,
        None,
        f"member{number}@example.invalid",
        f"Member {number}",
        is_admin,
    )


def _auth(member: Member) -> dict[str, str]:
    return {"Cookie": f"session_token={create_jwt(member.id, _settings.jwt_secret)}"}


class TestReturnLoanApi:
    def test_borrower_return_reports_email_not_applicable(self) -> None:
        notifier = FakeNotifier(True)
        client, conn = _setup_client(notifier)
        game = SqliteGameRepository(conn).upsert_by_bgg_id(1, "Catan", "")
        borrower = _member(SqliteMemberRepository(conn), 1)
        loan = SqliteLoanRepository(conn).create(game.id, borrower.id)

        response = client.patch(f"/api/loans/{loan.id}/return", headers=_auth(borrower))

        assert response.status_code == 200
        assert response.json()["forced_return_email_sent"] is None
        assert notifier.calls == []
        conn.close()

    def test_admin_own_return_reports_email_not_applicable(self) -> None:
        notifier = FakeNotifier(True)
        client, conn = _setup_client(notifier)
        game = SqliteGameRepository(conn).upsert_by_bgg_id(1, "Catan", "")
        admin = _member(SqliteMemberRepository(conn), 1, is_admin=True)
        loan = SqliteLoanRepository(conn).create(game.id, admin.id)

        response = client.patch(f"/api/loans/{loan.id}/return", headers=_auth(admin))

        assert response.status_code == 200
        assert response.json()["forced_return_email_sent"] is None
        assert notifier.calls == []
        conn.close()

    def test_forced_return_reports_successful_email(self) -> None:
        notifier = FakeNotifier(True)
        client, conn = _setup_client(notifier)
        game = SqliteGameRepository(conn).upsert_by_bgg_id(1, "Catan", "")
        member_repo = SqliteMemberRepository(conn)
        borrower = _member(member_repo, 1)
        admin = _member(member_repo, 2, is_admin=True)
        loan = SqliteLoanRepository(conn).create(game.id, borrower.id)

        response = client.patch(f"/api/loans/{loan.id}/return", headers=_auth(admin))

        assert response.status_code == 200
        assert response.json()["forced_return_email_sent"] is True
        assert notifier.calls == [(borrower.email, borrower.display_name, game.name)]
        conn.close()

    def test_forced_return_reports_unavailable_email(self) -> None:
        notifier = FakeNotifier(False)
        client, conn = _setup_client(notifier)
        game = SqliteGameRepository(conn).upsert_by_bgg_id(1, "Catan", "")
        member_repo = SqliteMemberRepository(conn)
        borrower = _member(member_repo, 1)
        admin = _member(member_repo, 2, is_admin=True)
        loan_repo = SqliteLoanRepository(conn)
        loan = loan_repo.create(game.id, borrower.id)

        response = client.patch(f"/api/loans/{loan.id}/return", headers=_auth(admin))

        assert response.status_code == 200
        assert response.json()["forced_return_email_sent"] is False
        assert loan_repo.get_by_id(loan.id).returned_at is not None  # type: ignore[union-attr]
        conn.close()

    @pytest.mark.parametrize("failing_lookup", ["member", "game"])
    def test_forced_return_reports_false_when_notification_lookup_raises(
        self, failing_lookup: str
    ) -> None:
        notifier = FakeNotifier(True)
        client, conn = _setup_client(notifier)
        game = SqliteGameRepository(conn).upsert_by_bgg_id(1, "Catan", "")
        member_repo = SqliteMemberRepository(conn)
        borrower = _member(member_repo, 1)
        admin = _member(member_repo, 2, is_admin=True)
        loan_repo = SqliteLoanRepository(conn)
        loan = loan_repo.create(game.id, borrower.id)
        if failing_lookup == "member":
            client.app.dependency_overrides[get_member_repo] = lambda: (  # type: ignore[attr-defined]
                RaisingBorrowerMemberRepository(conn, borrower.id)
            )
        else:
            client.app.dependency_overrides[get_game_repo] = lambda: (  # type: ignore[attr-defined]
                RaisingGameRepository(conn)
            )

        response = client.patch(f"/api/loans/{loan.id}/return", headers=_auth(admin))

        persisted = loan_repo.get_by_id(loan.id)
        assert response.status_code == 200
        assert response.json()["forced_return_email_sent"] is False
        assert persisted is not None
        assert persisted.returned_at is not None
        assert notifier.calls == []
        conn.close()

    def test_other_member_cannot_return_loan(self) -> None:
        client, conn = _setup_client(FakeNotifier(True))
        game = SqliteGameRepository(conn).upsert_by_bgg_id(1, "Catan", "")
        member_repo = SqliteMemberRepository(conn)
        borrower = _member(member_repo, 1)
        other = _member(member_repo, 2)
        loan = SqliteLoanRepository(conn).create(game.id, borrower.id)

        response = client.patch(f"/api/loans/{loan.id}/return", headers=_auth(other))

        assert response.status_code == 403
        assert response.json() == {
            "detail": "Solo puedes devolver tus propios préstamos."
        }
        conn.close()

    def test_already_returned_loan_is_rejected(self) -> None:
        client, conn = _setup_client(FakeNotifier(True))
        game = SqliteGameRepository(conn).upsert_by_bgg_id(1, "Catan", "")
        borrower = _member(SqliteMemberRepository(conn), 1)
        loan_repo = SqliteLoanRepository(conn)
        loan = loan_repo.create(game.id, borrower.id)
        loan_repo.mark_returned(loan.id)

        response = client.patch(f"/api/loans/{loan.id}/return", headers=_auth(borrower))

        assert response.status_code == 403
        assert response.json() == {"detail": "Este juego ya ha sido devuelto."}
        conn.close()


def test_my_loans_exposes_slug_and_item_type() -> None:
    client, conn = _setup_client()
    game_repo = SqliteGameRepository(conn)
    boardgame = game_repo.upsert_by_bgg_id(1, "Catan", "")
    rpg_item = game_repo.upsert_by_bgg_id(2, "Pathfinder", "", item_type="rpgitem")
    member = _member(SqliteMemberRepository(conn), 1)
    loan_repo = SqliteLoanRepository(conn)
    loan_repo.create(boardgame.id, member.id)
    loan_repo.create(rpg_item.id, member.id)

    response = client.get("/api/my-loans", headers=_auth(member))

    assert response.status_code == 200
    assert [(loan["game_slug"], loan["item_type"]) for loan in response.json()] == [
        ("catan", "boardgame"),
        ("pathfinder", "rpgitem"),
    ]
    conn.close()
