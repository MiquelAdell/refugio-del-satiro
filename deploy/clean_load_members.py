#!/usr/bin/env python3
"""Clean-load approved members into a test-only Refugio database.

This tool deliberately does not create password tokens or send email. It is
only appropriate when the existing member, loan, and token data is confirmed
disposable and a verified backup exists.
"""

from __future__ import annotations

import argparse
import csv
import sqlite3
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from collections.abc import Sequence

REQUIRED_COLUMNS = frozenset({"Nº Socio", "Apellidos", "Nombre", "Email", "Pagada"})


@dataclass(frozen=True)
class ApprovedMember:
    member_number: int
    first_name: str
    last_name: str
    nickname: str | None
    phone: str | None
    email: str
    display_name: str
    is_admin: bool
    is_active: bool
    last_payment: str | None
    gender: str | None


def normalize_email(value: str) -> str:
    return value.strip().casefold()


def load_members(csv_path: Path, admin_emails: frozenset[str]) -> list[ApprovedMember]:
    with csv_path.open(encoding="utf-8-sig", newline="") as source:
        rows = list(csv.DictReader(source))

    if not rows or rows[0].keys() is None:
        raise ValueError("CSV has no header row.")
    headers = frozenset(rows[0].keys())
    missing_columns = REQUIRED_COLUMNS - headers
    if missing_columns:
        raise ValueError(f"CSV is missing required columns: {sorted(missing_columns)}")

    parsed_rows: list[tuple[int, dict[str, str], str]] = []
    member_numbers: set[int] = set()
    emails: set[str] = set()
    for row_number, row in enumerate(rows, start=2):
        raw_number = row["Nº Socio"].strip()
        try:
            member_number = int(raw_number)
        except ValueError as exc:
            raise ValueError(f"Invalid member number on CSV row {row_number}.") from exc
        if member_number in member_numbers:
            raise ValueError("CSV has duplicate member numbers.")
        member_numbers.add(member_number)

        email = normalize_email(row.get("Email", ""))
        if not email:
            continue
        if email in emails:
            raise ValueError("CSV has duplicate email addresses.")
        emails.add(email)
        parsed_rows.append((member_number, row, email))

    missing_admins = admin_emails - emails
    if missing_admins:
        raise ValueError(
            "One or more approved administrator emails are not in the CSV."
        )

    nickname_counts = Counter(
        row.get("Apodo", "").strip()
        for _, row, _ in parsed_rows
        if row.get("Apodo", "").strip()
    )
    members = [
        ApprovedMember(
            member_number=member_number,
            first_name=row.get("Nombre", "").strip(),
            last_name=row.get("Apellidos", "").strip(),
            nickname=row.get("Apodo", "").strip() or None,
            phone=row.get("Telefóno", "").strip() or None,
            email=email,
            display_name=(
                row.get("Apodo", "").strip()
                if row.get("Apodo", "").strip()
                and nickname_counts[row.get("Apodo", "").strip()] == 1
                else f"{row.get('Nombre', '').strip()} {row.get('Apellidos', '').strip()}".strip()
            ),
            is_admin=email in admin_emails,
            is_active=row.get("Pagada", "").strip().casefold() == "sí",
            last_payment=row.get("Última cuota", "").strip() or None,
            gender=row.get("Género", "").strip() or None,
        )
        for member_number, row, email in parsed_rows
    ]
    return members


def summary(members: Sequence[ApprovedMember]) -> dict[str, int]:
    return {
        "members": len(members),
        "active_members": sum(member.is_active for member in members),
        "inactive_members": sum(not member.is_active for member in members),
        "administrators": sum(member.is_admin for member in members),
    }


def clean_load(
    connection: sqlite3.Connection, members: Sequence[ApprovedMember]
) -> dict[str, int]:
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        connection.execute("BEGIN IMMEDIATE")
        connection.execute("DELETE FROM password_tokens")
        connection.execute("DELETE FROM loans")
        connection.execute("DELETE FROM members")
        connection.executemany(
            """
            INSERT INTO members (
                member_number, first_name, last_name, nickname, phone, email,
                display_name, password_hash, is_admin, last_payment, gender, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)
            """,
            [
                (
                    member.member_number,
                    member.first_name,
                    member.last_name,
                    member.nickname,
                    member.phone,
                    member.email,
                    member.display_name,
                    int(member.is_admin),
                    member.last_payment,
                    member.gender,
                    int(member.is_active),
                )
                for member in members
            ],
        )
        foreign_key_errors = connection.execute("PRAGMA foreign_key_check").fetchall()
        if foreign_key_errors:
            raise RuntimeError("foreign_key_check failed after clean load")
        quick_check = [
            tuple(row) for row in connection.execute("PRAGMA quick_check").fetchall()
        ]
        if quick_check != [("ok",)]:
            raise RuntimeError("quick_check failed after clean load")
        database_counts = {
            "members": connection.execute("SELECT COUNT(*) FROM members").fetchone()[0],
            "active_members": connection.execute(
                "SELECT COUNT(*) FROM members WHERE is_active = 1"
            ).fetchone()[0],
            "administrators": connection.execute(
                "SELECT COUNT(*) FROM members WHERE is_admin = 1"
            ).fetchone()[0],
            "loans": connection.execute("SELECT COUNT(*) FROM loans").fetchone()[0],
            "password_tokens": connection.execute(
                "SELECT COUNT(*) FROM password_tokens"
            ).fetchone()[0],
        }
        expected_counts = {
            "members": len(members),
            "active_members": sum(member.is_active for member in members),
            "administrators": sum(member.is_admin for member in members),
        }
        if any(database_counts[key] != value for key, value in expected_counts.items()):
            raise RuntimeError("Database counts do not match the approved source.")
        if database_counts["loans"] != 0 or database_counts["password_tokens"] != 0:
            raise RuntimeError("Test loans or password tokens remain after clean load.")
        connection.commit()
        return database_counts
    except BaseException:
        connection.rollback()
        raise


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_path", type=Path)
    parser.add_argument("--database", required=True, type=Path)
    parser.add_argument("--admin-email", action="append", default=[])
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--expect-members", type=int)
    parser.add_argument("--expect-active-members", type=int)
    parser.add_argument("--expect-administrators", type=int)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    admin_emails = frozenset(normalize_email(email) for email in args.admin_email)
    members = load_members(args.csv_path, admin_emails)
    result = summary(members)
    expected = {
        "members": args.expect_members,
        "active_members": args.expect_active_members,
        "administrators": args.expect_administrators,
    }
    for key, expected_value in expected.items():
        if expected_value is not None and result[key] != expected_value:
            raise SystemExit(f"Expected {key}={expected_value}, got {result[key]}.")

    print(
        "Clean-load dry run: "
        + ", ".join(f"{key}={value}" for key, value in result.items())
    )
    if not args.apply:
        return

    with sqlite3.connect(args.database) as connection:
        database_counts = clean_load(connection, members)
    print(
        "Clean load applied: "
        + ", ".join(f"{key}={value}" for key, value in database_counts.items())
    )


if __name__ == "__main__":
    main()
