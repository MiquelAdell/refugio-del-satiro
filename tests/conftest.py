from __future__ import annotations

import sqlite3

import pytest

from backend.data.database import get_memory_connection
from backend.data.repositories.sqlite_game_repository import SqliteGameRepository
from backend.data.repositories.sqlite_loan_repository import SqliteLoanRepository
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
from backend.data.repositories.sqlite_password_token_repository import (
    SqlitePasswordTokenRepository,
)
from backend.migrations.runner import run_migrations


@pytest.fixture
def db_conn() -> sqlite3.Connection:
    conn = get_memory_connection()
    run_migrations(conn)
    yield conn  # type: ignore[misc]
    conn.close()


@pytest.fixture
def game_repo(db_conn: sqlite3.Connection) -> SqliteGameRepository:
    return SqliteGameRepository(db_conn)


@pytest.fixture
def member_repo(db_conn: sqlite3.Connection) -> SqliteMemberRepository:
    return SqliteMemberRepository(db_conn)


@pytest.fixture
def loan_repo(db_conn: sqlite3.Connection) -> SqliteLoanRepository:
    return SqliteLoanRepository(db_conn)


@pytest.fixture
def token_repo(db_conn: sqlite3.Connection) -> SqlitePasswordTokenRepository:
    return SqlitePasswordTokenRepository(db_conn)
