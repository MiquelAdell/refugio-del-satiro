from __future__ import annotations

from pathlib import Path

from backend.data.database import get_connection
from backend.migrations.runner import run_migrations
from deploy.clean_load_members import clean_load, load_members, summary

CSV_CONTENT = """\
Nº Socio,Apellidos,Nombre,Apodo,Telefóno,Email,Última cuota,Género,Pagada
1,Admin,First,First,600000001,admin@example.test,2026-01-01,X,Sí
2,Member,Inactive,,600000002,inactive@example.test,2026-01-01,X,No
3,Member,Missing,,600000003,,2026-01-01,X,Sí
"""


def test_clean_load_replaces_disposable_members_and_related_records(
    tmp_path: Path,
) -> None:
    csv_path = tmp_path / "members.csv"
    csv_path.write_text(CSV_CONTENT, encoding="utf-8")
    members = load_members(csv_path, frozenset({"admin@example.test"}))

    assert summary(members) == {
        "members": 2,
        "active_members": 1,
        "inactive_members": 1,
        "administrators": 1,
    }

    connection = get_connection(str(tmp_path / "refugio.db"))
    try:
        run_migrations(connection)
        connection.execute(
            """
            INSERT INTO members (
                member_number, first_name, last_name, email, display_name, is_admin,
                is_active
            ) VALUES (99, 'Test', 'Member', 'test@example.test', 'Test', 1, 1)
            """
        )
        member_id = connection.execute(
            "SELECT id FROM members WHERE member_number = 99"
        ).fetchone()[0]
        connection.execute(
            "INSERT INTO password_tokens (token, member_id, expires_at) VALUES (?, ?, ?)",
            ("test-token", member_id, "2026-01-02T00:00:00Z"),
        )
        connection.commit()

        clean_load(connection, members)

        rows = connection.execute(
            "SELECT member_number, is_admin, is_active, password_hash FROM members ORDER BY member_number"
        ).fetchall()
        assert [tuple(row) for row in rows] == [
            (1, 1, 1, None),
            (2, 0, 0, None),
        ]
        assert connection.execute("SELECT COUNT(*) FROM loans").fetchone()[0] == 0
        assert (
            connection.execute("SELECT COUNT(*) FROM password_tokens").fetchone()[0]
            == 0
        )
        assert connection.execute("PRAGMA foreign_key_check").fetchall() == []
        assert [tuple(row) for row in connection.execute("PRAGMA quick_check")] == [
            ("ok",)
        ]
    finally:
        connection.close()


def test_clean_load_requires_every_approved_administrator_in_source(
    tmp_path: Path,
) -> None:
    csv_path = tmp_path / "members.csv"
    csv_path.write_text(CSV_CONTENT, encoding="utf-8")

    try:
        load_members(csv_path, frozenset({"missing@example.test"}))
    except ValueError as error:
        assert (
            str(error)
            == "One or more approved administrator emails are not in the CSV."
        )
    else:
        raise AssertionError("Expected missing administrator validation to fail")
