from __future__ import annotations

from backend.domain.entities.member import Member
from backend.domain.repositories.member_repository import MemberRepository


class ValidateMemberUseCase:
    def __init__(self, member_repo: MemberRepository) -> None:
        self._member_repo = member_repo

    def execute(self, member_number: int) -> Member | None:
        return self._member_repo.get_by_member_number(member_number)
