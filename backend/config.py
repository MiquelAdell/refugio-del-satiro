from __future__ import annotations

import os
from dataclasses import dataclass, field

from dotenv import load_dotenv

load_dotenv()


def _env_bool(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise ValueError(f"{name} must be a boolean value")


def _env_positive_int(name: str, default: int) -> int:
    value = int(os.environ.get(name, str(default)))
    if value < 1:
        raise ValueError(f"{name} must be greater than zero")
    return value


def _env_csv(name: str, default: str) -> tuple[str, ...]:
    return tuple(
        part.strip()
        for part in os.environ.get(name, default).split(",")
        if part.strip()
    )


@dataclass(frozen=True)
class Settings:
    db_path: str = os.environ.get("REFUGIO_DB_PATH", "refugio.db")
    jwt_secret: str = os.environ.get(
        "REFUGIO_JWT_SECRET", "dev-secret-change-in-production-minimum-32-bytes"
    )
    base_url: str = os.environ.get("REFUGIO_BASE_URL", "http://localhost:5173/ludoteca")
    bgg_bearer_token: str | None = os.environ.get("BGG_BEARER_TOKEN")
    deepl_api_key: str | None = os.environ.get("DEEPL_API_KEY")
    smtp_host: str | None = os.environ.get("SMTP_HOST")
    smtp_port: int = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user: str | None = os.environ.get("SMTP_USER")
    smtp_password: str | None = os.environ.get("SMTP_PASSWORD")
    smtp_from: str | None = os.environ.get("SMTP_FROM")
    content_mirror_dir: str = os.environ.get(
        "REFUGIO_CONTENT_MIRROR_DIR", "frontend/public/content-mirror"
    )
    secure_auth_cookie: bool = field(
        default_factory=lambda: _env_bool("REFUGIO_SECURE_AUTH_COOKIE", False)
    )
    member_validation_rate_limit: int = field(
        default_factory=lambda: _env_positive_int(
            "REFUGIO_MEMBER_VALIDATION_RATE_LIMIT", 30
        )
    )
    member_validation_rate_window_seconds: int = field(
        default_factory=lambda: _env_positive_int(
            "REFUGIO_MEMBER_VALIDATION_RATE_WINDOW_SECONDS", 60
        )
    )
    member_validation_rate_max_clients: int = field(
        default_factory=lambda: _env_positive_int(
            "REFUGIO_MEMBER_VALIDATION_RATE_MAX_CLIENTS", 10_000
        )
    )
    trusted_proxy_cidrs: tuple[str, ...] = field(
        default_factory=lambda: _env_csv(
            "REFUGIO_TRUSTED_PROXY_CIDRS",
            "127.0.0.1/32,::1/128,172.16.0.0/12",
        )
    )

    @property
    def smtp_configured(self) -> bool:
        return all([self.smtp_host, self.smtp_user, self.smtp_password, self.smtp_from])
