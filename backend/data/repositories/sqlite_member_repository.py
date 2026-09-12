from __future__ import annotations

import sqlite3
from datetime import UTC, datetime

from backend.domain.entities.member import Member


def _row_to_member(row: sqlite3.Row) -> Member:
    keys = row.keys()
    return Member(
        id=row["id"],
        member_number=row["member_number"],
        first_name=row["first_name"],
        last_name=row["last_name"],
        nickname=row["nickname"],
        phone=row["phone"],
        email=row["email"],
        display_name=row["display_name"],
        password_hash=row["password_hash"],
        is_admin=bool(row["is_admin"]),
        is_active=bool(row["is_active"]) if "is_active" in keys else True,
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
        last_payment=row["last_payment"] if "last_payment" in keys else None,
        gender=row["gender"] if "gender" in keys else None,
    )


class SqliteMemberRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def get_by_id(self, member_id: int) -> Member | None:
        row = self._conn.execute(
            "SELECT * FROM members WHERE id = ?", (member_id,)
        ).fetchone()
        return _row_to_member(row) if row else None

    def get_by_email(self, email: str) -> Member | None:
        row = self._conn.execute(
            "SELECT * FROM members WHERE email = ?", (email,)
        ).fetchone()
        return _row_to_member(row) if row else None

    def get_by_member_number(self, member_number: int) -> Member | None:
        row = self._conn.execute(
            "SELECT * FROM members WHERE member_number = ?", (member_number,)
        ).fetchone()
        return _row_to_member(row) if row else None

    def list_all(self) -> list[Member]:
        rows = self._conn.execute(
            "SELECT * FROM members ORDER BY member_number"
        ).fetchall()
        return [_row_to_member(row) for row in rows]

    def upsert_by_email(
        self,
        member_number: int | None,
        first_name: str,
        last_name: str,
        nickname: str | None,
        phone: str | None,
        email: str,
        display_name: str,
        is_admin: bool,
        last_payment: str | None = None,
        gender: str | None = None,
        is_active: bool = True,
    ) -> Member:
        # is_admin and is_active are intentionally excluded from the ON CONFLICT
        # UPDATE below: a bulk re-import must never silently promote/demote
        # admin rights or flip active status on members that already exist.
        # Those values only apply when a row is first inserted.
        now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        self._conn.execute(
            """
            INSERT INTO members (
                member_number, first_name, last_name, nickname, phone, email,
                display_name, is_admin, last_payment, gender, is_active,
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(email) DO UPDATE SET
                member_number = excluded.member_number,
                first_name = excluded.first_name,
                last_name = excluded.last_name,
                nickname = excluded.nickname,
                phone = excluded.phone,
                display_name = excluded.display_name,
                last_payment = excluded.last_payment,
                gender = excluded.gender,
                updated_at = ?
            """,
            (
                member_number,
                first_name,
                last_name,
                nickname,
                phone,
                email,
                display_name,
                int(is_admin),
                last_payment,
                gender,
                int(is_active),
                now,
                now,
                now,
            ),
        )
        self._conn.commit()
        member = self.get_by_email(email)
        assert member is not None
        return member

    def update_membership_fields(
        self,
        member_id: int,
        last_payment: str | None = None,
        gender: str | None = None,
    ) -> None:
        now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        self._conn.execute(
            "UPDATE members SET last_payment = ?, gender = ?, updated_at = ? WHERE id = ?",
            (last_payment, gender, now, member_id),
        )
        self._conn.commit()

    def update_member_details(
        self,
        member_id: int,
        member_number: int | None,
        first_name: str,
        last_name: str,
        nickname: str | None,
        phone: str | None,
        email: str,
        display_name: str,
        last_payment: str | None,
        gender: str | None,
    ) -> None:
        now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        self._conn.execute(
            """
            UPDATE members SET
                member_number = ?, first_name = ?, last_name = ?, nickname = ?,
                phone = ?, email = ?, display_name = ?, last_payment = ?,
                gender = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                member_number,
                first_name,
                last_name,
                nickname,
                phone,
                email,
                display_name,
                last_payment,
                gender,
                now,
                member_id,
            ),
        )
        self._conn.commit()

    def update_display_name(self, member_id: int, display_name: str) -> None:
        now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        self._conn.execute(
            "UPDATE members SET display_name = ?, updated_at = ? WHERE id = ?",
            (display_name, now, member_id),
        )
        self._conn.commit()

    def set_active(self, member_id: int, is_active: bool) -> None:
        now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        self._conn.execute(
            "UPDATE members SET is_active = ?, updated_at = ? WHERE id = ?",
            (int(is_active), now, member_id),
        )
        self._conn.commit()

    def set_admin(self, member_id: int, is_admin: bool) -> None:
        now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        self._conn.execute(
            "UPDATE members SET is_admin = ?, updated_at = ? WHERE id = ?",
            (int(is_admin), now, member_id),
        )
        self._conn.commit()

    def set_password_hash(self, member_id: int, password_hash: str) -> None:
        now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        self._conn.execute(
            "UPDATE members SET password_hash = ?, updated_at = ? WHERE id = ?",
            (password_hash, now, member_id),
        )
        self._conn.commit()
