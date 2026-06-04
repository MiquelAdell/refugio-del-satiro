from datetime import datetime

from backend.domain.entities.member import Member


class TestMember:
    def test_create_member_with_all_fields(self) -> None:
        now = datetime(2026, 1, 1, 12, 0, 0)
        member = Member(
            id=1,
            member_number=66,
            first_name="Miquel",
            last_name="Adell Borràs",
            nickname=None,
            phone="620 01 58 60",
            email="miquel.adell@gmail.com",
            display_name="Miquel Adell Borràs",
            password_hash=None,
            is_admin=True,
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        assert member.id == 1
        assert member.member_number == 66
        assert member.first_name == "Miquel"
        assert member.last_name == "Adell Borràs"
        assert member.email == "miquel.adell@gmail.com"
        assert member.display_name == "Miquel Adell Borràs"
        assert member.is_admin is True
        assert member.password_hash is None

    def test_create_member_with_nullable_fields(self) -> None:
        now = datetime(2026, 1, 1, 12, 0, 0)
        member = Member(
            id=2,
            member_number=None,
            first_name="Test",
            last_name="User",
            nickname=None,
            phone=None,
            email="test@example.com",
            display_name="Test User",
            password_hash=None,
            is_admin=False,
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        assert member.member_number is None
        assert member.nickname is None
        assert member.phone is None

    def test_member_with_nickname(self) -> None:
        now = datetime(2026, 1, 1, 12, 0, 0)
        member = Member(
            id=3,
            member_number=4,
            first_name="Carles",
            last_name="Codina Busqueta",
            nickname="Caradras",
            phone="639 01 03 75",
            email="hothgond@gmail.com",
            display_name="Caradras",
            password_hash=None,
            is_admin=False,
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        assert member.nickname == "Caradras"
        assert member.display_name == "Caradras"

    def test_member_is_frozen(self) -> None:
        now = datetime(2026, 1, 1, 12, 0, 0)
        member = Member(
            id=1,
            member_number=1,
            first_name="Test",
            last_name="User",
            nickname=None,
            phone=None,
            email="test@example.com",
            display_name="Test User",
            password_hash=None,
            is_admin=False,
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        try:
            member.email = "changed@example.com"  # type: ignore[misc]
            raise AssertionError("Should have raised FrozenInstanceError")
        except AttributeError:
            pass
