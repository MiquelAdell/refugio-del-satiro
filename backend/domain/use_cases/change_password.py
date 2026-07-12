from __future__ import annotations

from backend.api.auth import hash_password, verify_password
from backend.domain.entities.member import Member
from backend.domain.repositories.member_repository import MemberRepository

MIN_PASSWORD_LENGTH = 4


class ChangePasswordError(Exception):
    pass


class ChangePasswordUseCase:
    def __init__(self, member_repo: MemberRepository) -> None:
        self._member_repo = member_repo

    def execute(self, member: Member, current_password: str, new_password: str) -> None:
        """Change a logged-in member's password. Raises ChangePasswordError on failure."""
        if member.password_hash is None or not verify_password(
            current_password, member.password_hash
        ):
            raise ChangePasswordError("La contraseña actual no es correcta.")

        if len(new_password) < MIN_PASSWORD_LENGTH:
            raise ChangePasswordError(
                f"La contraseña debe tener al menos {MIN_PASSWORD_LENGTH} caracteres."
            )

        hashed = hash_password(new_password)
        self._member_repo.set_password_hash(member.id, hashed)
