from __future__ import annotations

from pathlib import Path

from typer.testing import CliRunner

from backend.cli.main import app
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository

runner = CliRunner()

_CSV_CONTENT = """\
Nº Socio,Apellidos,Nombre,Apodo,Telefóno,Email,admin,Última cuota,Género
1,Adell,Miquel,Miquel,600 00 00 01,TEST_email@domain.com,yes,24/01/2026,Masculino
2,García López,Carla,Carla,600 00 00 02,TEST_email@domain.com,,24/01/2026,Femenino
3,Torres Ruiz,Jorge,,600 00 00 03,,,24/01/2026,Masculino
"""


def test_import_members_csv(monkeypatch: object, tmp_path: Path) -> None:
    """Import a sample CSV and verify count, admin flag, and email-less skip."""
    import backend.cli.main as cli_module
    from backend.config import Settings

    db_path = str(tmp_path / "test.db")
    csv_path = tmp_path / "members.csv"
    csv_path.write_text(_CSV_CONTENT, encoding="utf-8")

    monkeypatch.setattr(  # type: ignore[attr-defined]
        cli_module,
        "_get_settings",
        lambda: Settings(db_path=db_path, base_url="http://test.local"),
    )

    result = runner.invoke(app, ["import-members", str(csv_path)])

    assert result.exit_code == 0, f"CLI failed: {result.output}"

    from backend.data.database import get_connection

    conn = get_connection(db_path)
    try:
        member_repo = SqliteMemberRepository(conn)
        members = member_repo.list_all()
        # 3 rows, but Jorge Torres Ruiz has no email => 2 members
        assert len(members) == 2

        admin = member_repo.get_by_email("TEST_email@domain.com")
        assert admin is not None
        assert admin.is_admin is True
        assert admin.last_payment == "24/01/2026"
        assert admin.gender == "Masculino"

        carla = member_repo.get_by_email("TEST_email@domain.com")
        assert carla is not None
        assert carla.is_admin is False
    finally:
        conn.close()

    # Output should contain one-time URLs
    assert "set-password?token=" in result.output
    assert "2 new member(s) imported" in result.output
