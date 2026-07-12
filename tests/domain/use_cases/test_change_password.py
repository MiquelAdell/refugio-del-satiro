from __future__ import annotations

import pytest

from backend.api.auth import hash_password, verify_password
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
from backend.domain.use_cases.change_password import (
    ChangePasswordError,
    ChangePasswordUseCase,
)


class TestChangePassword:
    def test_changes_password_on_correct_current_password(
        self, member_repo: SqliteMemberRepository
    ) -> None:
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "test@test.com", "Test User", False
        )
        member_repo.set_password_hash(member.id, hash_password("oldpassword"))
        member = member_repo.get_by_id(member.id)
        assert member is not None
        use_case = ChangePasswordUseCase(member_repo)

        use_case.execute(member, "oldpassword", "newpassword")

        updated = member_repo.get_by_id(member.id)
        assert updated is not None
        assert updated.password_hash is not None
        assert verify_password("newpassword", updated.password_hash)

    def test_raises_on_wrong_current_password(
        self, member_repo: SqliteMemberRepository
    ) -> None:
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "test@test.com", "Test User", False
        )
        member_repo.set_password_hash(member.id, hash_password("oldpassword"))
        member = member_repo.get_by_id(member.id)
        assert member is not None
        use_case = ChangePasswordUseCase(member_repo)

        with pytest.raises(ChangePasswordError):
            use_case.execute(member, "wrongpassword", "newpassword")

    def test_raises_when_no_password_set(
        self, member_repo: SqliteMemberRepository
    ) -> None:
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "test@test.com", "Test User", False
        )
        use_case = ChangePasswordUseCase(member_repo)

        with pytest.raises(ChangePasswordError):
            use_case.execute(member, "anything", "newpassword")

    def test_raises_on_too_short_new_password(
        self, member_repo: SqliteMemberRepository
    ) -> None:
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "test@test.com", "Test User", False
        )
        member_repo.set_password_hash(member.id, hash_password("oldpassword"))
        member = member_repo.get_by_id(member.id)
        assert member is not None
        use_case = ChangePasswordUseCase(member_repo)

        with pytest.raises(ChangePasswordError):
            use_case.execute(member, "oldpassword", "abc")
