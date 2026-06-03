from __future__ import annotations

import sqlite3
from pathlib import Path

import pytest
from typer.testing import CliRunner

from backend.cli.main import app
from backend.data.database import get_memory_connection
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
from backend.migrations.runner import run_migrations

runner = CliRunner()

_CSV_FILE = Path(__file__).resolve().parent.parent.parent / "members.csv"
CSV_PATH = str(_CSV_FILE)


@pytest.mark.skipif(
    not _CSV_FILE.exists(),
    reason="members.csv not present (local-only fixture)",
)
def test_import_members_csv(monkeypatch: object, tmp_path: Path) -> None:
    """Import the actual members.csv and verify correct count and admin flag."""
    import backend.cli.main as cli_module
    from backend.config import Settings

    db_path = str(tmp_path / "test.db")

    # Patch settings to use temp DB
    monkeypatch.setattr(  # type: ignore[attr-defined]
        cli_module,
        "_get_settings",
        lambda: Settings(db_path=db_path, base_url="http://test.local"),
    )

    result = runner.invoke(app, ["import-members", CSV_PATH])

    assert result.exit_code == 0, f"CLI failed: {result.output}"

    # Verify the correct number of members were imported
    # The CSV has 40 rows, but Jorge Torres Ruiz (row 74) has no email => 39 members
    from backend.data.database import get_connection

    conn = get_connection(db_path)
    try:
        member_repo = SqliteMemberRepository(conn)
        members = member_repo.list_all()
        assert len(members) == 39

        # Verify Miquel Adell is admin
        miquel = member_repo.get_by_email("miquel.adell@gmail.com")
        assert miquel is not None
        assert miquel.is_admin is True

        # Verify a non-admin member
        carles = member_repo.get_by_email("hothgond@gmail.com")
        assert carles is not None
        assert carles.is_admin is False
    finally:
        conn.close()

    # Output should contain one-time URLs
    assert "set-password?token=" in result.output
    assert "39 new member(s) imported" in result.output
