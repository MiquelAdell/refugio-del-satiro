from __future__ import annotations

import logging

from backend.api.access_logging import SensitiveQueryFilter
from backend.api.app import create_app


def _access_record(request_target: str) -> logging.LogRecord:
    return logging.LogRecord(
        name="uvicorn.access",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg='%s - "%s %s HTTP/%s" %d',
        args=("203.0.113.10:50000", "GET", request_target, "1.1", 200),
        exc_info=None,
    )


class TestSensitiveQueryFilter:
    def test_app_factory_installs_one_filter(self) -> None:
        create_app()
        create_app()

        installed_filters = tuple(
            item
            for item in logging.getLogger("uvicorn.access").filters
            if isinstance(item, SensitiveQueryFilter)
        )

        assert len(installed_filters) == 1

    def test_removes_entire_member_validation_query_before_formatting(self) -> None:
        record = _access_record(
            "/api/members/validate?number=987654&tracking=member-987654"
        )

        accepted = SensitiveQueryFilter().filter(record)

        assert accepted is True
        assert record.getMessage() == (
            '203.0.113.10:50000 - "GET /api/members/validate HTTP/1.1" 200'
        )
        assert "987654" not in record.getMessage()

    def test_preserves_other_request_targets_exactly(self) -> None:
        record = _access_record("/api/games?search=terraforming")

        accepted = SensitiveQueryFilter().filter(record)

        assert accepted is True
        assert record.getMessage() == (
            '203.0.113.10:50000 - "GET /api/games?search=terraforming HTTP/1.1" 200'
        )
