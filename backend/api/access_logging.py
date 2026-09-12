from __future__ import annotations

import logging

VALIDATION_PATH = "/api/members/validate"


def _redact_sensitive_query(request_target: str) -> str:
    path, separator, _query = request_target.partition("?")
    if separator and path.rstrip("/") == VALIDATION_PATH:
        return path
    return request_target


class SensitiveQueryFilter(logging.Filter):
    """Remove membership lookup queries from Uvicorn access-log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        args = record.args
        if not isinstance(args, tuple) or len(args) < 3 or not isinstance(args[2], str):
            return True

        safe_target = _redact_sensitive_query(args[2])
        if safe_target != args[2]:
            record.args = (*args[:2], safe_target, *args[3:])
        return True


def configure_access_log_redaction() -> None:
    access_logger = logging.getLogger("uvicorn.access")
    if not any(
        isinstance(item, SensitiveQueryFilter) for item in access_logger.filters
    ):
        access_logger.addFilter(SensitiveQueryFilter())
