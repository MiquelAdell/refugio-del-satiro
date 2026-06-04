from __future__ import annotations

import sqlite3


def get_connection(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.row_factory = sqlite3.Row
    return conn


def get_memory_connection() -> sqlite3.Connection:
    """In-memory SQLite connection for testing."""
    return get_connection(":memory:")
