from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class LoanHistoryEntryResponse(BaseModel):
    member_display_name: str | None
    borrowed_at: datetime
    returned_at: datetime | None
