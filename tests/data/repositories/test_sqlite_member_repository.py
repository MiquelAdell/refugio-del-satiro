from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository


class TestSqliteMemberRepository:
    def test_upsert_creates_new_member(
        self, member_repo: SqliteMemberRepository
    ) -> None:
        member = member_repo.upsert_by_email(
            member_number=66,
            first_name="Miquel",
            last_name="Adell Borràs",
            nickname=None,
            phone="620 01 58 60",
            email="miquel.adell@gmail.com",
            display_name="Miquel Adell Borràs",
            is_admin=True,
        )
        assert member.email == "miquel.adell@gmail.com"
        assert member.member_number == 66
        assert member.is_admin is True

    def test_upsert_updates_existing_member(
        self, member_repo: SqliteMemberRepository
    ) -> None:
        member_repo.upsert_by_email(
            66,
            "Miquel",
            "Adell",
            None,
            None,
            "TEST_email@domain.com",
            "Miquel Adell",
            False,
        )
        updated = member_repo.upsert_by_email(
            66,
            "Miquel",
            "Adell Borràs",
            None,
            "620 01 58 60",
            "TEST_email@domain.com",
            "Miquel Adell Borràs",
            True,
        )
        assert updated.last_name == "Adell Borràs"

    def test_upsert_does_not_change_admin_or_active_for_existing_member(
        self, member_repo: SqliteMemberRepository
    ) -> None:
        """A bulk re-import must never silently promote/demote admin rights or
        flip active status on a member that already exists."""
        member_repo.upsert_by_email(
            66,
            "Miquel",
            "Adell",
            None,
            None,
            "TEST_email@domain.com",
            "Miquel Adell",
            is_admin=True,
            is_active=False,
        )
        updated = member_repo.upsert_by_email(
            66,
            "Miquel",
            "Adell Borràs",
            None,
            "620 01 58 60",
            "TEST_email@domain.com",
            "Miquel Adell Borràs",
            is_admin=False,
            is_active=True,
        )
        assert updated.is_admin is True
        assert updated.is_active is False

    def test_upsert_applies_admin_and_active_on_creation(
        self, member_repo: SqliteMemberRepository
    ) -> None:
        member = member_repo.upsert_by_email(
            67,
            "New",
            "Member",
            None,
            None,
            "TEST_email@domain.com",
            "New Member",
            is_admin=True,
            is_active=False,
        )
        assert member.is_admin is True
        assert member.is_active is False

    def test_set_admin(self, member_repo: SqliteMemberRepository) -> None:
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )
        member_repo.set_admin(member.id, True)
        updated = member_repo.get_by_id(member.id)
        assert updated is not None
        assert updated.is_admin is True

    def test_get_by_email(self, member_repo: SqliteMemberRepository) -> None:
        member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )
        found = member_repo.get_by_email("TEST_email@domain.com")
        assert found is not None
        assert found.first_name == "Test"

    def test_get_by_email_not_found(self, member_repo: SqliteMemberRepository) -> None:
        assert member_repo.get_by_email("TEST_email@domain.com") is None

    def test_list_all_sorted_by_member_number(
        self, member_repo: SqliteMemberRepository
    ) -> None:
        member_repo.upsert_by_email(
            50,
            "B",
            "User",
            None,
            None,
            "member-50@example.invalid",
            "B User",
            False,
        )
        member_repo.upsert_by_email(
            10,
            "A",
            "User",
            None,
            None,
            "member-10@example.invalid",
            "A User",
            False,
        )
        members = member_repo.list_all()
        numbers = [m.member_number for m in members]
        assert numbers == [10, 50]

    def test_nullable_member_number(self, member_repo: SqliteMemberRepository) -> None:
        member = member_repo.upsert_by_email(
            None,
            "No",
            "Number",
            None,
            None,
            "TEST_email@domain.com",
            "No Number",
            False,
        )
        assert member.member_number is None

    def test_update_display_name(self, member_repo: SqliteMemberRepository) -> None:
        member = member_repo.upsert_by_email(
            1, "Test", "User", "Nick", None, "TEST_email@domain.com", "Nick", False
        )
        member_repo.update_display_name(member.id, "Test User")
        updated = member_repo.get_by_id(member.id)
        assert updated is not None
        assert updated.display_name == "Test User"

    def test_set_password_hash(self, member_repo: SqliteMemberRepository) -> None:
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "TEST_email@domain.com", "Test User", False
        )
        assert member.password_hash is None
        member_repo.set_password_hash(member.id, "$2b$12$fakehash")
        updated = member_repo.get_by_id(member.id)
        assert updated is not None
        assert updated.password_hash == "$2b$12$fakehash"

    def test_accented_characters(self, member_repo: SqliteMemberRepository) -> None:
        member = member_repo.upsert_by_email(
            28,
            "Jesús",
            "Navío Enríquez",
            None,
            None,
            "TEST_email@domain.com",
            "Jesús Navío Enríquez",
            False,
        )
        assert member.first_name == "Jesús"
        assert member.last_name == "Navío Enríquez"
