from __future__ import annotations

from email import message_from_string
from email.header import decode_header, make_header
from unittest.mock import MagicMock

from pytest import MonkeyPatch

from backend.config import Settings
from backend.data.email_client import EmailClient

OBSOLETE_BRAND = "Préstamos Sát" + "iros"


def test_send_access_link_uses_refugio_del_satiro_brand(
    monkeypatch: MonkeyPatch,
) -> None:
    smtp = MagicMock()
    monkeypatch.setattr("backend.data.email_client.smtplib.SMTP", smtp)  # type: ignore[attr-defined]
    client = EmailClient(
        Settings(
            smtp_host="smtp.example.invalid",
            smtp_user="user",
            smtp_password="password",
            smtp_from="noreply@example.invalid",
        )
    )

    sent = client.send_access_link(
        "member@example.invalid", "Ada", "https://example.invalid/set-password"
    )

    assert sent is True
    smtp.return_value.__enter__.return_value.sendmail.assert_called_once()
    raw_message = smtp.return_value.__enter__.return_value.sendmail.call_args.args[2]
    message = message_from_string(raw_message)
    subject = str(make_header(decode_header(message["Subject"])))
    html = message.get_payload()[0].get_payload(decode=True).decode()
    assert "Refugio del Sátiro" in subject
    assert OBSOLETE_BRAND not in subject
    assert "Refugio del Sátiro" in html
    assert OBSOLETE_BRAND not in html
