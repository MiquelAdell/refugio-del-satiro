from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
from backend.data.repositories.sqlite_password_token_repository import (
    SqlitePasswordTokenRepository,
)


class TestSqlitePasswordTokenRepository:
    def _create_member(self, member_repo: SqliteMemberRepository) -> int:
        member = member_repo.upsert_by_email(
            1,
            "Test",
            "User",
            None,
            None,
            "TEST_email@domain.com",
            "Test User",
            False,
        )
        return member.id

    def test_create_token(
        self,
        token_repo: SqlitePasswordTokenRepository,
        member_repo: SqliteMemberRepository,
    ) -> None:
        member_id = self._create_member(member_repo)
        token = token_repo.create(member_id)
        assert token.member_id == member_id
        assert len(token.token) == 64  # 32 bytes hex = 64 chars
        assert token.used_at is None
        assert token.expires_at > token.created_at

    def test_get_by_token(
        self,
        token_repo: SqlitePasswordTokenRepository,
        member_repo: SqliteMemberRepository,
    ) -> None:
        member_id = self._create_member(member_repo)
        created = token_repo.create(member_id)
        found = token_repo.get_by_token(created.token)
        assert found is not None
        assert found.id == created.id

    def test_get_by_token_not_found(
        self, token_repo: SqlitePasswordTokenRepository
    ) -> None:
        assert token_repo.get_by_token("nonexistent") is None

    def test_mark_used(
        self,
        token_repo: SqlitePasswordTokenRepository,
        member_repo: SqliteMemberRepository,
    ) -> None:
        member_id = self._create_member(member_repo)
        created = token_repo.create(member_id)
        token_repo.mark_used(created.id)
        found = token_repo.get_by_token(created.token)
        assert found is not None
        assert found.used_at is not None
