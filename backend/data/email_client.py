from __future__ import annotations

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from html import escape

from backend.config import Settings

SMTP_TIMEOUT_SECONDS = 10.0


class EmailClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def _deliver(self, message: MIMEMultipart, to_email: str) -> bool:
        smtp_host = self._settings.smtp_host
        smtp_user = self._settings.smtp_user
        smtp_password = self._settings.smtp_password
        smtp_from = self._settings.smtp_from
        if not smtp_host or not smtp_user or not smtp_password or not smtp_from:
            return False

        with smtplib.SMTP(
            smtp_host,
            self._settings.smtp_port,
            timeout=SMTP_TIMEOUT_SECONDS,
        ) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_from, to_email, message.as_string())

        return True

    def send_access_link(self, to_email: str, display_name: str, url: str) -> bool:
        """Send a password-set link email. Returns True if sent, False if SMTP not configured."""
        if not self._settings.smtp_configured:
            return False

        html = f"""\
<html>
<body style="font-family: system-ui, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto;">
    <h2>¡Hola {display_name}!</h2>
    <p>Bienvenido/a a <strong>Refugio del Sátiro</strong>, la aplicación de préstamo de juegos del Refugio del Sátiro.</p>
    <p>Para acceder, haz clic en el siguiente enlace para establecer tu contraseña:</p>
    <p style="margin: 24px 0;">
        <a href="{url}"
           style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Establecer contraseña
        </a>
    </p>
    <p style="color: #6b7280; font-size: 14px;">
        Este enlace caduca en 48 horas. Si no has solicitado este acceso, ignora este mensaje.
    </p>
    <p style="color: #6b7280; font-size: 14px;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
        <a href="{url}" style="color: #2563eb;">{url}</a>
    </p>
</body>
</html>"""

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Refugio del Sátiro — Acceso a tu cuenta"
        msg["From"] = self._settings.smtp_from  # type: ignore[assignment]
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))

        return self._deliver(msg, to_email)

    def send_forced_return(
        self,
        to_email: str,
        display_name: str,
        item_name: str,
    ) -> bool:
        if not self._settings.smtp_configured:
            return False

        text = (
            f"Hola, {display_name}:\n\n"
            f'La administración ha marcado "{item_name}" como devuelto porque ya '
            "estaba en el local.\n\n"
            "Cuando devuelvas un préstamo, recuerda registrarlo en la ludoteca para "
            "que el catálogo muestre que vuelve a estar disponible.\n\n"
            "Gracias, Refugio del Sátiro."
        )
        safe_display_name = escape(display_name)
        safe_item_name = escape(item_name)
        html = f"""\
<html>
<body style="font-family: system-ui, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto;">
    <p>Hola, {safe_display_name}:</p>
    <p>La administración ha marcado &quot;{safe_item_name}&quot; como devuelto porque ya estaba en el local.</p>
    <p>Cuando devuelvas un préstamo, recuerda registrarlo en la ludoteca para que el catálogo muestre que vuelve a estar disponible.</p>
    <p>Gracias, Refugio del Sátiro.</p>
</body>
</html>"""

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Refugio del Sátiro: préstamo marcado como devuelto"
        msg["From"] = self._settings.smtp_from  # type: ignore[assignment]
        msg["To"] = to_email
        msg.attach(MIMEText(text, "plain", "utf-8"))
        msg.attach(MIMEText(html, "html", "utf-8"))

        return self._deliver(msg, to_email)
