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
            66, "Miquel", "Adell", None, None, "miquel@test.com", "Miquel Adell", False
        )
        updated = member_repo.upsert_by_email(
            66,
            "Miquel",
            "Adell Borràs",
            None,
            "620 01 58 60",
            "miquel@test.com",
            "Miquel Adell Borràs",
            True,
        )
        assert updated.last_name == "Adell Borràs"
        assert updated.is_admin is True

    def test_get_by_email(self, member_repo: SqliteMemberRepository) -> None:
        member_repo.upsert_by_email(
            1, "Test", "User", None, None, "test@example.com", "Test User", False
        )
        found = member_repo.get_by_email("test@example.com")
        assert found is not None
        assert found.first_name == "Test"

    def test_get_by_email_not_found(self, member_repo: SqliteMemberRepository) -> None:
        assert member_repo.get_by_email("nobody@example.com") is None

    def test_list_all_sorted_by_member_number(
        self, member_repo: SqliteMemberRepository
    ) -> None:
        member_repo.upsert_by_email(
            50, "B", "User", None, None, "b@test.com", "B User", False
        )
        member_repo.upsert_by_email(
            10, "A", "User", None, None, "a@test.com", "A User", False
        )
        members = member_repo.list_all()
        numbers = [m.member_number for m in members]
        assert numbers == [10, 50]

    def test_nullable_member_number(self, member_repo: SqliteMemberRepository) -> None:
        member = member_repo.upsert_by_email(
            None, "No", "Number", None, None, "no@test.com", "No Number", False
        )
        assert member.member_number is None

    def test_update_display_name(self, member_repo: SqliteMemberRepository) -> None:
        member = member_repo.upsert_by_email(
            1, "Test", "User", "Nick", None, "test@test.com", "Nick", False
        )
        member_repo.update_display_name(member.id, "Test User")
        updated = member_repo.get_by_id(member.id)
        assert updated is not None
        assert updated.display_name == "Test User"

    def test_set_password_hash(self, member_repo: SqliteMemberRepository) -> None:
        member = member_repo.upsert_by_email(
            1, "Test", "User", None, None, "test@test.com", "Test User", False
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
            "jesus@test.com",
            "Jesús Navío Enríquez",
            False,
        )
        assert member.first_name == "Jesús"
        assert member.last_name == "Navío Enríquez"
