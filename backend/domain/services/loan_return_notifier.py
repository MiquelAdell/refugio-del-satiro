from __future__ import annotations

from typing import Protocol


class LoanReturnNotifier(Protocol):
    def send_forced_return(
        self,
        to_email: str,
        display_name: str,
        item_name: str,
    ) -> bool: ...
