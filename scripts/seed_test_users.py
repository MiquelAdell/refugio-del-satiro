"""Idempotently seed two test accounts (member + admin) into the dev SQLite DB.

Reads credentials from env vars (with safe defaults) so Playwright e2e tests
can log in without depending on real member data.

Usage:
    python -m scripts.seed_test_users
    # or:
    python scripts/seed_test_users.py

Env vars:
    TEST_MEMBER_EMAIL    (default: e2e-member@test.local)
    TEST_MEMBER_PASSWORD (default: e2e-test-password-member)
    TEST_ADMIN_EMAIL     (default: e2e-admin@test.local)
    TEST_ADMIN_PASSWORD  (default: e2e-test-password-admin)
    REFUGIO_DB_PATH      (resolved via backend.config.Settings)
"""

from __future__ import annotations

import os
from dataclasses import dataclass

from backend.api.auth import hash_password
from backend.config import Settings
from backend.data.database import get_connection
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
from backend.migrations.runner import run_migrations


@dataclass(frozen=True)
class TestAccount:
    label: str
    email: str
    password: str
    first_name: str
    last_name: str
    is_admin: bool

    @property
    def role(self) -> str:
        return "admin" if self.is_admin else "member"

    @property
    def display_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


def _accounts_from_env() -> list[TestAccount]:
    return [
        TestAccount(
            label="TEST_MEMBER",
            email=os.environ.get("TEST_MEMBER_EMAIL", "e2e-member@test.local"),
            password=os.environ.get("TEST_MEMBER_PASSWORD", "e2e-test-password-member"),
            first_name="E2E",
            last_name="Member",
            is_admin=False,
        ),
        TestAccount(
            label="TEST_ADMIN",
            email=os.environ.get("TEST_ADMIN_EMAIL", "e2e-admin@test.local"),
            password=os.environ.get("TEST_ADMIN_PASSWORD", "e2e-test-password-admin"),
            first_name="E2E",
            last_name="Admin",
            is_admin=True,
        ),
    ]


def _seed_account(repo: SqliteMemberRepository, account: TestAccount) -> None:
    member = repo.upsert_by_email(
        member_number=None,
        first_name=account.first_name,
        last_name=account.last_name,
        nickname=None,
        phone=None,
        email=account.email,
        display_name=account.display_name,
        is_admin=account.is_admin,
    )
    # Ensure active (upsert preserves existing value; new rows default to active
    # per the migration, but be explicit for re-runs that may have deactivated).
    repo.set_active(member.id, True)
    repo.set_password_hash(member.id, hash_password(account.password))


def main() -> None:
    settings = Settings()
    conn = get_connection(settings.db_path)
    try:
        run_migrations(conn)
        repo = SqliteMemberRepository(conn)
        for account in _accounts_from_env():
            _seed_account(repo, account)
            print(f"seeded {account.label} {account.email} (role={account.role})")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
