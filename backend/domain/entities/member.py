from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class Member:
    id: int
    member_number: int | None
    first_name: str
    last_name: str
    nickname: str | None
    phone: str | None
    email: str
    display_name: str
    password_hash: str | None
    is_admin: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_payment: str | None = None
    gender: str | None = None
