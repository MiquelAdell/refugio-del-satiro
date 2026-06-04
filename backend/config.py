from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    db_path: str = os.environ.get("REFUGIO_DB_PATH", "refugio.db")
    jwt_secret: str = os.environ.get(
        "REFUGIO_JWT_SECRET", "dev-secret-change-in-production-minimum-32-bytes"
    )
    base_url: str = os.environ.get("REFUGIO_BASE_URL", "http://localhost:5173/prestamos")
    bgg_bearer_token: str | None = os.environ.get("BGG_BEARER_TOKEN")
    smtp_host: str | None = os.environ.get("SMTP_HOST")
    smtp_port: int = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user: str | None = os.environ.get("SMTP_USER")
    smtp_password: str | None = os.environ.get("SMTP_PASSWORD")
    smtp_from: str | None = os.environ.get("SMTP_FROM")
    content_mirror_dir: str = os.environ.get(
        "REFUGIO_CONTENT_MIRROR_DIR", "frontend/public/content-mirror"
    )

    @property
    def smtp_configured(self) -> bool:
        return all([self.smtp_host, self.smtp_user, self.smtp_password, self.smtp_from])
