from __future__ import annotations

from email import message_from_string
from email.header import decode_header, make_header
from unittest.mock import MagicMock

from pytest import MonkeyPatch

from backend.config import Settings
from backend.data.email_client import SMTP_TIMEOUT_SECONDS, EmailClient

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
    smtp.assert_called_once_with(
        "smtp.example.invalid", 587, timeout=SMTP_TIMEOUT_SECONDS
    )
    smtp.return_value.__enter__.return_value.sendmail.assert_called_once()
    raw_message = smtp.return_value.__enter__.return_value.sendmail.call_args.args[2]
    message = message_from_string(raw_message)
    subject = str(make_header(decode_header(message["Subject"])))
    html = message.get_payload()[0].get_payload(decode=True).decode()
    assert "Refugio del Sátiro" in subject
    assert OBSOLETE_BRAND not in subject
    assert "Refugio del Sátiro" in html
    assert OBSOLETE_BRAND not in html


def test_send_forced_return_sends_plain_and_escaped_html_parts(
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

    sent = client.send_forced_return(
        "member@example.invalid", "Ada <Admin>", 'Catan & "Friends"'
    )

    assert sent is True
    smtp.assert_called_once_with(
        "smtp.example.invalid", 587, timeout=SMTP_TIMEOUT_SECONDS
    )
    raw_message = smtp.return_value.__enter__.return_value.sendmail.call_args.args[2]
    message = message_from_string(raw_message)
    subject = str(make_header(decode_header(message["Subject"])))
    plain = message.get_payload()[0].get_payload(decode=True).decode()
    html = message.get_payload()[1].get_payload(decode=True).decode()
    assert subject == "Refugio del Sátiro: préstamo marcado como devuelto"
    assert "Hola, Ada <Admin>:" in plain
    assert '"Catan & "Friends""' in plain
    assert "Ada &lt;Admin&gt;" in html
    assert "Catan &amp; &quot;Friends&quot;" in html
    assert message.get_content_type() == "multipart/alternative"


def test_send_forced_return_returns_false_without_smtp_configuration() -> None:
    client = EmailClient(
        Settings(
            smtp_host=None,
            smtp_user=None,
            smtp_password=None,
            smtp_from=None,
        )
    )

    assert client.send_forced_return("member@example.invalid", "Ada", "Catan") is False
