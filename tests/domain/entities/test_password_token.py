from datetime import datetime, timedelta

from backend.domain.entities.password_token import PasswordToken


class TestPasswordToken:
    def test_create_unused_token(self) -> None:
        now = datetime(2026, 3, 15, 10, 0, 0)
        expires = now + timedelta(hours=48)
        token = PasswordToken(
            id=1,
            token="abc123def456",
            member_id=5,
            created_at=now,
            expires_at=expires,
            used_at=None,
        )
        assert token.token == "abc123def456"
        assert token.member_id == 5
        assert token.used_at is None
        assert token.expires_at == expires

    def test_create_used_token(self) -> None:
        now = datetime(2026, 3, 15, 10, 0, 0)
        expires = now + timedelta(hours=48)
        used = now + timedelta(hours=1)
        token = PasswordToken(
            id=2,
            token="xyz789",
            member_id=5,
            created_at=now,
            expires_at=expires,
            used_at=used,
        )
        assert token.used_at == used

    def test_token_is_frozen(self) -> None:
        now = datetime(2026, 3, 15, 10, 0, 0)
        token = PasswordToken(
            id=1,
            token="abc123",
            member_id=5,
            created_at=now,
            expires_at=now + timedelta(hours=48),
            used_at=None,
        )
        try:
            token.used_at = now  # type: ignore[misc]
            raise AssertionError("Should have raised FrozenInstanceError")
        except AttributeError:
            pass
