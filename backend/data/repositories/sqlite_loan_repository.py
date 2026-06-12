from __future__ import annotations

import sqlite3
from datetime import UTC, datetime

from backend.domain.entities.loan import Loan


def _row_to_loan(row: sqlite3.Row) -> Loan:
    return Loan(
        id=row["id"],
        game_id=row["game_id"],
        member_id=row["member_id"],
        borrowed_at=datetime.fromisoformat(row["borrowed_at"]),
        returned_at=(
            datetime.fromisoformat(row["returned_at"]) if row["returned_at"] else None
        ),
    )


class SqliteLoanRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def get_by_id(self, loan_id: int) -> Loan | None:
        row = self._conn.execute(
            "SELECT * FROM loans WHERE id = ?", (loan_id,)
        ).fetchone()
        return _row_to_loan(row) if row else None

    def get_active_by_game_id(self, game_id: int) -> Loan | None:
        row = self._conn.execute(
            "SELECT * FROM loans WHERE game_id = ? AND returned_at IS NULL",
            (game_id,),
        ).fetchone()
        return _row_to_loan(row) if row else None

    def list_active_by_member_id(self, member_id: int) -> list[Loan]:
        rows = self._conn.execute(
            "SELECT * FROM loans WHERE member_id = ? AND returned_at IS NULL ORDER BY borrowed_at DESC",
            (member_id,),
        ).fetchall()
        return [_row_to_loan(row) for row in rows]

    def list_by_game_id(self, game_id: int) -> list[Loan]:
        rows = self._conn.execute(
            "SELECT * FROM loans WHERE game_id = ? ORDER BY borrowed_at DESC",
            (game_id,),
        ).fetchall()
        return [_row_to_loan(row) for row in rows]

    def create(self, game_id: int, member_id: int) -> Loan:
        now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        cursor = self._conn.execute(
            "INSERT INTO loans (game_id, member_id, borrowed_at) VALUES (?, ?, ?)",
            (game_id, member_id, now),
        )
        self._conn.commit()
        loan = self.get_by_id(cursor.lastrowid)  # type: ignore[arg-type]
        assert loan is not None
        return loan

    def mark_returned(self, loan_id: int) -> Loan:
        now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        self._conn.execute(
            "UPDATE loans SET returned_at = ? WHERE id = ?",
            (now, loan_id),
        )
        self._conn.commit()
        loan = self.get_by_id(loan_id)
        assert loan is not None
        return loan
