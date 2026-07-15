from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta

from backend.domain.entities.member import Member
from backend.domain.entities.password_token import PasswordToken
from backend.domain.use_cases.import_members import ImportMembersUseCase


class FakeMemberRepository:
    """In-memory dict-backed implementation of MemberRepository protocol."""

    def __init__(self) -> None:
        self._members: dict[int, Member] = {}
        self._next_id: int = 1

    def get_by_id(self, member_id: int) -> Member | None:
        return self._members.get(member_id)

    def get_by_email(self, email: str) -> Member | None:
        for m in self._members.values():
            if m.email == email:
                return m
        return None

    def list_all(self) -> list[Member]:
        return sorted(
            self._members.values(),
            key=lambda m: (m.member_number or 0, m.id),
        )

    def get_by_member_number(self, member_number: int) -> Member | None:
        return next(
            (m for m in self._members.values() if m.member_number == member_number),
            None,
        )

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
    ) -> Member:
        now = datetime.now(UTC)
        existing = self.get_by_email(email)
        if existing:
            # Matches the SQLite repo: re-imports never change is_admin/is_active
            # for members that already exist.
            member = Member(
                id=existing.id,
                member_number=member_number,
                first_name=first_name,
                last_name=last_name,
                nickname=nickname,
                phone=phone,
                email=email,
                display_name=display_name,
                password_hash=existing.password_hash,
                is_admin=existing.is_admin,
                is_active=existing.is_active,
                created_at=existing.created_at,
                updated_at=now,
                last_payment=last_payment,
                gender=gender,
            )
        else:
            member = Member(
                id=self._next_id,
                member_number=member_number,
                first_name=first_name,
                last_name=last_name,
                nickname=nickname,
                phone=phone,
                email=email,
                display_name=display_name,
                password_hash=None,
                is_admin=is_admin,
                is_active=is_active,
                created_at=now,
                updated_at=now,
                last_payment=last_payment,
                gender=gender,
            )
            self._next_id += 1
        self._members[member.id] = member
        return member

    def set_admin(self, member_id: int, is_admin: bool) -> None:
        m = self._members[member_id]
        self._members[member_id] = Member(
            id=m.id,
            member_number=m.member_number,
            first_name=m.first_name,
            last_name=m.last_name,
            nickname=m.nickname,
            phone=m.phone,
            email=m.email,
            display_name=m.display_name,
            password_hash=m.password_hash,
            is_admin=is_admin,
            is_active=m.is_active,
            created_at=m.created_at,
            updated_at=datetime.now(UTC),
            last_payment=m.last_payment,
            gender=m.gender,
        )

    def update_membership_fields(
        self,
        member_id: int,
        last_payment: str | None = None,
        gender: str | None = None,
    ) -> None:
        m = self._members[member_id]
        self._members[member_id] = Member(
            id=m.id,
            member_number=m.member_number,
            first_name=m.first_name,
            last_name=m.last_name,
            nickname=m.nickname,
            phone=m.phone,
            email=m.email,
            display_name=m.display_name,
            password_hash=m.password_hash,
            is_admin=m.is_admin,
            is_active=m.is_active,
            created_at=m.created_at,
            updated_at=datetime.now(UTC),
            last_payment=last_payment,
            gender=gender,
        )

    def update_display_name(self, member_id: int, display_name: str) -> None:
        m = self._members[member_id]
        self._members[member_id] = Member(
            id=m.id,
            member_number=m.member_number,
            first_name=m.first_name,
            last_name=m.last_name,
            nickname=m.nickname,
            phone=m.phone,
            email=m.email,
            display_name=display_name,
            password_hash=m.password_hash,
            is_admin=m.is_admin,
            is_active=m.is_active,
            created_at=m.created_at,
            updated_at=datetime.now(UTC),
            last_payment=m.last_payment,
            gender=m.gender,
        )

    def set_password_hash(self, member_id: int, password_hash: str) -> None:
        m = self._members[member_id]
        self._members[member_id] = Member(
            id=m.id,
            member_number=m.member_number,
            first_name=m.first_name,
            last_name=m.last_name,
            nickname=m.nickname,
            phone=m.phone,
            email=m.email,
            display_name=m.display_name,
            password_hash=password_hash,
            is_admin=m.is_admin,
            is_active=m.is_active,
            created_at=m.created_at,
            updated_at=datetime.now(UTC),
            last_payment=m.last_payment,
            gender=m.gender,
        )


class FakePasswordTokenRepository:
    """In-memory dict-backed implementation of PasswordTokenRepository protocol."""

    def __init__(self) -> None:
        self._tokens: dict[int, PasswordToken] = {}
        self._next_id: int = 1

    def create(self, member_id: int) -> PasswordToken:
        now = datetime.now(UTC)
        token = PasswordToken(
            id=self._next_id,
            token=secrets.token_hex(32),
            member_id=member_id,
            created_at=now,
            expires_at=now + timedelta(hours=48),
            used_at=None,
        )
        self._tokens[token.id] = token
        self._next_id += 1
        return token

    def get_by_token(self, token: str) -> PasswordToken | None:
        for t in self._tokens.values():
            if t.token == token:
                return t
        return None

    def mark_used(self, token_id: int) -> None:
        t = self._tokens[token_id]
        self._tokens[token_id] = PasswordToken(
            id=t.id,
            token=t.token,
            member_id=t.member_id,
            created_at=t.created_at,
            expires_at=t.expires_at,
            used_at=datetime.now(UTC),
        )


def _make_raw(
    *,
    nombre: str = "Test",
    apellidos: str = "User",
    apodo: str = "",
    email: str = "TEST_email@domain.com",
    telefono: str = "",
    socio: str = "",
    admin: str = "",
    ultima_cuota: str = "",
    genero: str = "",
    pagada: str = "",
) -> dict[str, str]:
    return {
        "Nº Socio": socio,
        "Apellidos": apellidos,
        "Nombre": nombre,
        "Apodo": apodo,
        "Telefóno": telefono,
        "Email": email,
        "admin": admin,
        "Última cuota": ultima_cuota,
        "Género": genero,
        "Pagada": pagada,
    }


BASE_URL = "http://localhost:8000"


def test_display_name_uses_nickname_when_unique() -> None:
    member_repo = FakeMemberRepository()
    token_repo = FakePasswordTokenRepository()
    uc = ImportMembersUseCase(member_repo, token_repo, BASE_URL)

    results = uc.execute(
        [
            _make_raw(
                nombre="Carles",
                apellidos="Codina",
                apodo="Caradras",
                email="TEST_email@domain.com",
            ),
            _make_raw(
                nombre="Lucas",
                apellidos="De la Cruz",
                apodo="Borkyl",
                email="TEST_email@domain.com",
            ),
        ]
    )

    assert len(results) == 2
    names = {r.member.display_name for r in results}
    assert "Caradras" in names
    assert "Borkyl" in names


def test_display_name_falls_back_when_nickname_not_unique() -> None:
    member_repo = FakeMemberRepository()
    token_repo = FakePasswordTokenRepository()
    uc = ImportMembersUseCase(member_repo, token_repo, BASE_URL)

    results = uc.execute(
        [
            _make_raw(
                nombre="Alice", apellidos="Smith", apodo="Ace", email="TEST_email@domain.com"
            ),
            _make_raw(nombre="Bob", apellidos="Jones", apodo="Ace", email="TEST_email@domain.com"),
        ]
    )

    names = {r.member.display_name for r in results}
    assert "Alice Smith" in names
    assert "Bob Jones" in names
    assert "Ace" not in names


def test_members_without_email_are_skipped() -> None:
    member_repo = FakeMemberRepository()
    token_repo = FakePasswordTokenRepository()
    uc = ImportMembersUseCase(member_repo, token_repo, BASE_URL)

    results = uc.execute(
        [
            _make_raw(nombre="Jorge", apellidos="Torres", email=""),
            _make_raw(nombre="Valid", apellidos="User", email="TEST_email@domain.com"),
        ]
    )

    assert len(results) == 1
    assert results[0].member.email == "TEST_email@domain.com"
    assert len(member_repo.list_all()) == 1


def test_upsert_updates_existing_members() -> None:
    member_repo = FakeMemberRepository()
    token_repo = FakePasswordTokenRepository()
    uc = ImportMembersUseCase(member_repo, token_repo, BASE_URL)

    # First import
    uc.execute([_make_raw(nombre="Old", apellidos="Name", email="TEST_email@domain.com")])

    # Second import with updated name
    results = uc.execute(
        [_make_raw(nombre="New", apellidos="Name", email="TEST_email@domain.com")]
    )

    # No new members, so no tokens
    assert len(results) == 0

    # But member was updated
    member = member_repo.get_by_email("TEST_email@domain.com")
    assert member is not None
    assert member.first_name == "New"

    # Only 1 member total
    assert len(member_repo.list_all()) == 1


def test_password_tokens_generated_for_new_members_only() -> None:
    member_repo = FakeMemberRepository()
    token_repo = FakePasswordTokenRepository()
    uc = ImportMembersUseCase(member_repo, token_repo, BASE_URL)

    # Import first member
    results1 = uc.execute([_make_raw(nombre="A", apellidos="B", email="TEST_email@domain.com")])
    assert len(results1) == 1  # new member gets token

    # Import both old and new member
    results2 = uc.execute(
        [
            _make_raw(nombre="A", apellidos="B", email="TEST_email@domain.com"),
            _make_raw(nombre="C", apellidos="D", email="TEST_email@domain.com"),
        ]
    )

    # Only the new member gets a token
    assert len(results2) == 1
    assert results2[0].member.email == "TEST_email@domain.com"
    assert "set-password?token=" in results2[0].token_url


def test_display_name_recomputation_on_collision() -> None:
    member_repo = FakeMemberRepository()
    token_repo = FakePasswordTokenRepository()
    uc = ImportMembersUseCase(member_repo, token_repo, BASE_URL)

    # First import: nickname "Ace" is unique
    uc.execute(
        [_make_raw(nombre="Alice", apellidos="Smith", apodo="Ace", email="TEST_email@domain.com")]
    )
    m = member_repo.get_by_email("TEST_email@domain.com")
    assert m is not None
    assert m.display_name == "Ace"

    # Second import: adds another "Ace" -- collision!
    uc.execute(
        [
            _make_raw(
                nombre="Alice", apellidos="Smith", apodo="Ace", email="TEST_email@domain.com"
            ),
            _make_raw(nombre="Bob", apellidos="Jones", apodo="Ace", email="TEST_email@domain.com"),
        ]
    )

    # After recomputation, both should fall back to full names
    alice = member_repo.get_by_email("TEST_email@domain.com")
    bob = member_repo.get_by_email("TEST_email@domain.com")
    assert alice is not None
    assert bob is not None
    assert alice.display_name == "Alice Smith"
    assert bob.display_name == "Bob Jones"


def test_import_maps_ultima_cuota_and_genero() -> None:
    member_repo = FakeMemberRepository()
    token_repo = FakePasswordTokenRepository()
    uc = ImportMembersUseCase(member_repo, token_repo, BASE_URL)

    uc.execute(
        [
            _make_raw(
                nombre="Ana",
                apellidos="García",
                email="TEST_email@domain.com",
                ultima_cuota="5/02/2022",
                genero="Femenino",
            ),
            _make_raw(
                nombre="Pedro",
                apellidos="López",
                email="TEST_email@domain.com",
                ultima_cuota="",
                genero="",
            ),
        ]
    )

    ana = member_repo.get_by_email("TEST_email@domain.com")
    assert ana is not None
    assert ana.last_payment == "5/02/2022"
    assert ana.gender == "Femenino"

    pedro = member_repo.get_by_email("TEST_email@domain.com")
    assert pedro is not None
    assert pedro.last_payment is None
    assert pedro.gender is None


def test_unpaid_member_is_created_inactive() -> None:
    member_repo = FakeMemberRepository()
    token_repo = FakePasswordTokenRepository()
    uc = ImportMembersUseCase(member_repo, token_repo, BASE_URL)

    uc.execute(
        [_make_raw(nombre="Jose", apellidos="Delgado", email="TEST_email@domain.com", pagada="No")]
    )

    jose = member_repo.get_by_email("TEST_email@domain.com")
    assert jose is not None
    assert jose.is_active is False


def test_paid_and_honorary_members_are_created_active() -> None:
    member_repo = FakeMemberRepository()
    token_repo = FakePasswordTokenRepository()
    uc = ImportMembersUseCase(member_repo, token_repo, BASE_URL)

    uc.execute(
        [
            _make_raw(nombre="Paid", apellidos="Member", email="TEST_email@domain.com", pagada="Sí"),
            _make_raw(
                nombre="Honorary",
                apellidos="Member",
                email="TEST_email@domain.com",
                pagada="Honorífic",
            ),
        ]
    )

    assert member_repo.get_by_email("TEST_email@domain.com").is_active is True  # type: ignore[union-attr]
    assert member_repo.get_by_email("TEST_email@domain.com").is_active is True  # type: ignore[union-attr]


def test_reimport_does_not_change_admin_status_of_existing_member() -> None:
    """A member.csv export has no `admin` column, so re-importing it must not
    silently strip admin rights from members already flagged as admin."""
    member_repo = FakeMemberRepository()
    token_repo = FakePasswordTokenRepository()
    uc = ImportMembersUseCase(member_repo, token_repo, BASE_URL)

    uc.execute([_make_raw(email="TEST_email@domain.com", admin="yes")])
    assert member_repo.get_by_email("TEST_email@domain.com").is_admin is True  # type: ignore[union-attr]

    # Re-import the same row without an "admin" column value, as a real sheet
    # export would look.
    uc.execute([_make_raw(email="TEST_email@domain.com", admin="")])
    assert member_repo.get_by_email("TEST_email@domain.com").is_admin is True  # type: ignore[union-attr]


def test_acting_member_id_is_kept_admin_even_if_demoted_by_import() -> None:
    member_repo = FakeMemberRepository()
    token_repo = FakePasswordTokenRepository()
    uc = ImportMembersUseCase(member_repo, token_repo, BASE_URL)

    acting_admin = member_repo.upsert_by_email(
        member_number=None,
        first_name="Acting",
        last_name="Admin",
        nickname=None,
        phone=None,
        email="TEST_email@domain.com",
        display_name="Acting Admin",
        is_admin=True,
    )

    uc.execute(
        [_make_raw(email="TEST_email@domain.com", admin="")],
        acting_member_id=acting_admin.id,
    )

    assert member_repo.get_by_id(acting_admin.id).is_admin is True  # type: ignore[union-attr]
