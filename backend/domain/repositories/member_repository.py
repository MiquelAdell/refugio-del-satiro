from __future__ import annotations

from typing import Protocol

from backend.domain.entities.member import Member


class MemberRepository(Protocol):
    def get_by_id(self, member_id: int) -> Member | None: ...

    def get_by_email(self, email: str) -> Member | None: ...

    def get_by_member_number(self, member_number: int) -> Member | None: ...

    def list_all(self) -> list[Member]: ...

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
    ) -> Member: ...

    def update_display_name(self, member_id: int, display_name: str) -> None: ...

    def set_active(self, member_id: int, is_active: bool) -> None: ...

    def set_admin(self, member_id: int, is_admin: bool) -> None: ...

    def update_membership_fields(
        self,
        member_id: int,
        last_payment: str | None = None,
        gender: str | None = None,
    ) -> None: ...

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
    ) -> None: ...

    def set_password_hash(self, member_id: int, password_hash: str) -> None: ...
