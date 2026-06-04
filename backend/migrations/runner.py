from __future__ import annotations

import sqlite3
from collections.abc import Callable
from pathlib import Path

from backend.domain.slug import ensure_unique, slugify

MIGRATIONS_DIR = Path(__file__).parent


def _backfill_game_slugs(conn: sqlite3.Connection) -> None:
    """Generate slugs for games that don't yet have one.

    Run after ``005_add_game_slug.sql`` adds the column with an empty default.
    """
    rows = conn.execute(
        "SELECT id, name FROM games WHERE slug = '' OR slug IS NULL"
    ).fetchall()
    if not rows:
        return
    taken = {
        r[0]
        for r in conn.execute(
            "SELECT slug FROM games WHERE slug != ''"
        ).fetchall()
    }
    for row in rows:
        unique = ensure_unique(slugify(row["name"]), taken)
        conn.execute("UPDATE games SET slug = ? WHERE id = ?", (unique, row["id"]))
        taken.add(unique)
    conn.commit()


POST_MIGRATION_HOOKS: dict[str, Callable[[sqlite3.Connection], None]] = {
    "005_add_game_slug": _backfill_game_slugs,
}


def _ensure_schema_table(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
        )
        """
    )


def _get_applied_versions(conn: sqlite3.Connection) -> set[str]:
    rows = conn.execute("SELECT version FROM schema_migrations").fetchall()
    return {row[0] for row in rows}


def _get_pending_migrations(
    applied: set[str],
) -> list[tuple[str, str]]:
    """Return (version, sql) pairs for unapplied migrations, sorted by version."""
    sql_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    pending = []
    for path in sql_files:
        version = path.stem
        if version not in applied:
            pending.append((version, path.read_text(encoding="utf-8")))
    return pending


def run_migrations(conn: sqlite3.Connection) -> list[str]:
    """Run all pending migrations. Returns list of applied version names."""
    _ensure_schema_table(conn)
    applied = _get_applied_versions(conn)
    pending = _get_pending_migrations(applied)

    applied_now: list[str] = []
    for version, sql in pending:
        conn.executescript(sql)
        hook = POST_MIGRATION_HOOKS.get(version)
        if hook is not None:
            hook(conn)
        conn.execute(
            "INSERT INTO schema_migrations (version) VALUES (?)", (version,)
        )
        conn.commit()
        applied_now.append(version)

    return applied_now
