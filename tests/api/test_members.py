from __future__ import annotations

import sqlite3

import pytest
from fastapi.testclient import TestClient

from backend.api.app import create_app
from backend.api.auth import create_jwt
from backend.api.dependencies import _settings, get_db_conn
from backend.data.database import get_memory_connection
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
from backend.domain.entities.member import Member
from backend.migrations.runner import run_migrations

NOT_FOUND_DETAIL = "Socio no encontrado."


def _setup_client() -> tuple[TestClient, sqlite3.Connection]:
    conn = get_memory_connection()
    conn.close()
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
    is_active: bool = True,
    last_payment: str | None = None,
    gender: str | None = None,
) -> Member:
    member = member_repo.upsert_by_email(
        member_number=number,
        first_name=first_name,
        last_name=last_name,
        nickname=None,
        phone=None,
        email=email,
        display_name=f"{first_name} {last_name}",
        is_admin=is_admin,
        last_payment=last_payment,
        gender=gender,
    )
    if not is_active:
        member_repo.set_active(member.id, False)
        member = member_repo.get_by_id(member.id)  # type: ignore[assignment]
    return member


class TestValidateMember:
    def test_active_male_member_returns_socio(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        _make_member(
            member_repo,
            number=42,
            first_name="Carlos",
            last_name="López",
            email="carlos@test.com",
            gender="Masculino",
            last_payment="5/02/2022",
        )

        response = client.get("/api/members/validate?number=42")

        assert response.status_code == 200
        assert response.json() == {
            "member_number": 42,
            "first_name": "Carlos",
            "last_name": "López",
            "active": True,
            "last_payment": "5/02/2022",
            "gender_label": "socio",
        }
        conn.close()

    def test_active_female_member_returns_socia(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        _make_member(
            member_repo,
            number=7,
            first_name="Ana",
            last_name="García",
            email="ana@test.com",
            gender="Femenino",
            last_payment="1/01/2023",
        )

        response = client.get("/api/members/validate?number=7")

        assert response.status_code == 200
        assert response.json() == {
            "member_number": 7,
            "first_name": "Ana",
            "last_name": "García",
            "active": True,
            "last_payment": "1/01/2023",
            "gender_label": "socia",
        }
        conn.close()

    def test_member_without_gender_returns_socio_a(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        _make_member(
            member_repo,
            number=15,
            first_name="Jordan",
            last_name="Martínez",
            email="jordan@test.com",
            gender=None,
            last_payment=None,
        )

        response = client.get("/api/members/validate?number=15")

        assert response.status_code == 200
        assert response.json() == {
            "member_number": 15,
            "first_name": "Jordan",
            "last_name": "Martínez",
            "active": True,
            "last_payment": None,
            "gender_label": "socio/a",
        }
        conn.close()

    def test_inactive_member_returns_active_false(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        _make_member(
            member_repo,
            number=99,
            first_name="Inactivo",
            last_name="Prueba",
            email="inactivo@test.com",
            gender="Masculino",
            is_active=False,
        )

        response = client.get("/api/members/validate?number=99")

        assert response.status_code == 200
        assert response.json() == {
            "member_number": 99,
            "first_name": "Inactivo",
            "last_name": "Prueba",
            "active": False,
            "last_payment": None,
            "gender_label": "socio",
        }
        conn.close()

    def test_unknown_member_number_returns_404(self) -> None:
        client, conn = _setup_client()

        response = client.get("/api/members/validate?number=9999")

        assert response.status_code == 404
        assert response.json() == {"detail": NOT_FOUND_DETAIL}
        conn.close()

    def test_no_auth_required(self) -> None:
        """Validate endpoint is public — no cookie needed."""
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        _make_member(
            member_repo,
            number=1,
            first_name="Public",
            last_name="Member",
            email="pub@test.com",
        )

        response = client.get("/api/members/validate?number=1")

        assert response.status_code == 200
        conn.close()


class TestAdminPatchMember:
    def test_patch_updates_last_payment_and_gender(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        admin = _make_member(
            member_repo,
            number=1,
            first_name="Admin",
            last_name="User",
            email="admin@test.com",
            is_admin=True,
        )
        target = _make_member(
            member_repo,
            number=2,
            first_name="Target",
            last_name="Member",
            email="target@test.com",
        )

        response = client.patch(
            f"/api/admin/members/{target.id}",
            json={
                "first_name": "Target",
                "last_name": "Member",
                "email": "target@test.com",
                "last_payment": "10/03/2024",
                "gender": "Femenino",
            },
            headers=_auth_cookie(admin),
        )

        assert response.status_code == 200
        assert response.json() == {"ok": True}

        updated = member_repo.get_by_id(target.id)
        assert updated is not None
        assert updated.last_payment == "10/03/2024"
        assert updated.gender == "Femenino"
        conn.close()

    def test_patch_updates_name_number_phone_and_admin(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        admin = _make_member(
            member_repo,
            number=1,
            first_name="Admin",
            last_name="User",
            email="admin@test.com",
            is_admin=True,
        )
        target = _make_member(
            member_repo,
            number=2,
            first_name="Target",
            last_name="Member",
            email="target@test.com",
        )

        response = client.patch(
            f"/api/admin/members/{target.id}",
            json={
                "first_name": "Renamed",
                "last_name": "Person",
                "email": "renamed@test.com",
                "nickname": "Ren",
                "phone": "600 11 22 33",
                "member_number": 42,
                "is_admin": True,
            },
            headers=_auth_cookie(admin),
        )

        assert response.status_code == 200
        updated = member_repo.get_by_id(target.id)
        assert updated is not None
        assert updated.first_name == "Renamed"
        assert updated.last_name == "Person"
        assert updated.email == "renamed@test.com"
        assert updated.nickname == "Ren"
        assert updated.phone == "600 11 22 33"
        assert updated.member_number == 42
        assert updated.display_name == "Renamed Person"
        assert updated.is_admin is True
        conn.close()

    def test_patch_email_conflict_returns_409(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        admin = _make_member(
            member_repo,
            number=1,
            first_name="Admin",
            last_name="User",
            email="admin@test.com",
            is_admin=True,
        )
        target = _make_member(
            member_repo,
            number=2,
            first_name="Target",
            last_name="Member",
            email="target@test.com",
        )

        response = client.patch(
            f"/api/admin/members/{target.id}",
            json={
                "first_name": "Target",
                "last_name": "Member",
                "email": "admin@test.com",
            },
            headers=_auth_cookie(admin),
        )

        assert response.status_code == 409
        conn.close()

    def test_patch_member_number_conflict_returns_409(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        admin = _make_member(
            member_repo,
            number=1,
            first_name="Admin",
            last_name="User",
            email="admin@test.com",
            is_admin=True,
        )
        target = _make_member(
            member_repo,
            number=2,
            first_name="Target",
            last_name="Member",
            email="target@test.com",
        )

        response = client.patch(
            f"/api/admin/members/{target.id}",
            json={
                "first_name": "Target",
                "last_name": "Member",
                "email": "target@test.com",
                "member_number": 1,
            },
            headers=_auth_cookie(admin),
        )

        assert response.status_code == 409
        conn.close()

    def test_patch_clears_fields_when_null(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        admin = _make_member(
            member_repo,
            number=1,
            first_name="Admin",
            last_name="User",
            email="admin@test.com",
            is_admin=True,
        )
        target = _make_member(
            member_repo,
            number=2,
            first_name="Target",
            last_name="Member",
            email="target@test.com",
            last_payment="5/02/2022",
            gender="Masculino",
        )

        response = client.patch(
            f"/api/admin/members/{target.id}",
            json={
                "first_name": "Target",
                "last_name": "Member",
                "email": "target@test.com",
                "last_payment": None,
                "gender": None,
            },
            headers=_auth_cookie(admin),
        )

        assert response.status_code == 200
        updated = member_repo.get_by_id(target.id)
        assert updated is not None
        assert updated.last_payment is None
        assert updated.gender is None
        conn.close()

    def test_patch_unknown_member_returns_404(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        admin = _make_member(
            member_repo,
            number=1,
            first_name="Admin",
            last_name="User",
            email="admin@test.com",
            is_admin=True,
        )

        response = client.patch(
            "/api/admin/members/9999",
            json={
                "first_name": "Ghost",
                "last_name": "Member",
                "email": "ghost@test.com",
                "last_payment": "1/01/2024",
            },
            headers=_auth_cookie(admin),
        )

        assert response.status_code == 404
        assert response.json() == {"detail": NOT_FOUND_DETAIL}
        conn.close()

    def test_patch_requires_admin(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        regular = _make_member(
            member_repo,
            number=1,
            first_name="Regular",
            last_name="User",
            email="regular@test.com",
            is_admin=False,
        )

        response = client.patch(
            f"/api/admin/members/{regular.id}",
            json={
                "first_name": "Regular",
                "last_name": "User",
                "email": "regular@test.com",
                "last_payment": "1/01/2024",
            },
            headers=_auth_cookie(regular),
        )

        assert response.status_code == 403
        conn.close()


class TestAdminImportMembers:
    CSV_HEADER = (
        "Nº Socio,Apellidos,Nombre,Apodo,Telefóno,Email,admin,Última cuota,Género"
    )

    def _csv_bytes(self, rows: list[str]) -> bytes:
        return "\n".join([self.CSV_HEADER, *rows]).encode("utf-8")

    def _post_import(
        self, client: TestClient, admin: Member, csv_bytes: bytes
    ):  # type: ignore[no-untyped-def]
        return client.post(
            "/api/admin/members/import",
            files={"file": ("members.csv", csv_bytes, "text/csv")},
            headers=_auth_cookie(admin),
        )

    def _make_admin(self, member_repo: SqliteMemberRepository) -> Member:
        return _make_member(
            member_repo,
            number=1,
            first_name="Admin",
            last_name="User",
            email="admin@test.com",
            is_admin=True,
        )

    def test_import_creates_members_and_returns_tokens(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        admin = self._make_admin(member_repo)

        csv_bytes = self._csv_bytes(
            [
                "10,García,Ana,Anita,600111222,ana@test.com,,5/02/2022,Femenino",
                "11,López,Carlos,,600333444,carlos@test.com,,1/01/2023,Masculino",
            ]
        )
        response = self._post_import(client, admin, csv_bytes)

        assert response.status_code == 200
        body = response.json()
        assert body["total_rows"] == 2
        assert body["skipped_rows"] == 0
        assert len(body["created"]) == 2

        by_email = {c["email"]: c for c in body["created"]}
        assert by_email["ana@test.com"]["display_name"] == "Anita"
        assert by_email["carlos@test.com"]["display_name"] == "Carlos López"
        for created in body["created"]:
            assert "/set-password?token=" in created["token_url"]

        ana = member_repo.get_by_email("ana@test.com")
        assert ana is not None
        assert ana.member_number == 10
        conn.close()

    def test_reimport_same_file_returns_empty_created(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        admin = self._make_admin(member_repo)

        csv_bytes = self._csv_bytes(
            ["10,García,Ana,,600111222,ana@test.com,,5/02/2022,Femenino"]
        )
        first = self._post_import(client, admin, csv_bytes)
        assert first.status_code == 200
        assert len(first.json()["created"]) == 1

        second = self._post_import(client, admin, csv_bytes)

        assert second.status_code == 200
        assert second.json() == {"created": [], "total_rows": 1, "skipped_rows": 0}
        # Upsert: no duplicate member created (admin + Ana only)
        assert len(member_repo.list_all()) == 2
        conn.close()

    def test_blank_email_rows_counted_as_skipped(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        admin = self._make_admin(member_repo)

        csv_bytes = self._csv_bytes(
            [
                "10,García,Ana,,600111222,ana@test.com,,,",
                "11,Sin,Email,,600333444,,,,",
            ]
        )
        response = self._post_import(client, admin, csv_bytes)

        assert response.status_code == 200
        body = response.json()
        assert body["total_rows"] == 2
        assert body["skipped_rows"] == 1
        assert len(body["created"]) == 1
        assert body["created"][0]["email"] == "ana@test.com"
        conn.close()

    def test_missing_email_header_returns_400(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        admin = self._make_admin(member_repo)

        csv_bytes = b"Nombre,Apellidos\nAna,Garc\xc3\xada\n"
        response = self._post_import(client, admin, csv_bytes)

        assert response.status_code == 400
        assert response.json() == {
            "detail": "El archivo CSV debe tener una columna 'Email'."
        }
        conn.close()

    def test_import_requires_admin(self) -> None:
        client, conn = _setup_client()
        member_repo = SqliteMemberRepository(conn)
        regular = _make_member(
            member_repo,
            number=1,
            first_name="Regular",
            last_name="User",
            email="regular@test.com",
            is_admin=False,
        )

        csv_bytes = self._csv_bytes(["10,García,Ana,,600111222,ana@test.com,,,"])
        response = client.post(
            "/api/admin/members/import",
            files={"file": ("members.csv", csv_bytes, "text/csv")},
            headers=_auth_cookie(regular),
        )

        assert response.status_code == 403
        conn.close()


@pytest.mark.parametrize(
    ("gender", "expected_label"),
    [
        ("Masculino", "socio"),
        ("Femenino", "socia"),
        (None, "socio/a"),
    ],
)
def test_gender_label_derivation(gender: str | None, expected_label: str) -> None:
    """Parametric coverage of the gender_label server-side derivation."""
    client, conn = _setup_client()
    member_repo = SqliteMemberRepository(conn)
    _make_member(
        member_repo,
        number=1,
        first_name="Test",
        last_name="Member",
        email=f"test_{gender}@test.com",
        gender=gender,
    )

    response = client.get("/api/members/validate?number=1")

    assert response.status_code == 200
    assert response.json()["gender_label"] == expected_label
    conn.close()
