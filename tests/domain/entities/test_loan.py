from datetime import datetime

from backend.domain.entities.loan import Loan


class TestLoan:
    def test_create_active_loan(self) -> None:
        now = datetime(2026, 3, 15, 10, 0, 0)
        loan = Loan(
            id=1,
            game_id=5,
            member_id=3,
            borrowed_at=now,
            returned_at=None,
        )
        assert loan.id == 1
        assert loan.game_id == 5
        assert loan.member_id == 3
        assert loan.borrowed_at == now
        assert loan.returned_at is None

    def test_create_returned_loan(self) -> None:
        borrowed = datetime(2026, 3, 1, 10, 0, 0)
        returned = datetime(2026, 3, 15, 14, 30, 0)
        loan = Loan(
            id=2,
            game_id=5,
            member_id=3,
            borrowed_at=borrowed,
            returned_at=returned,
        )
        assert loan.returned_at == returned

    def test_loan_is_frozen(self) -> None:
        now = datetime(2026, 3, 15, 10, 0, 0)
        loan = Loan(id=1, game_id=5, member_id=3, borrowed_at=now, returned_at=None)
        try:
            loan.returned_at = now  # type: ignore[misc]
            raise AssertionError("Should have raised FrozenInstanceError")
        except AttributeError:
            pass
