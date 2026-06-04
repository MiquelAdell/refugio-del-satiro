from __future__ import annotations

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from backend.config import Settings


class EmailClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def send_access_link(self, to_email: str, display_name: str, url: str) -> bool:
        """Send a password-set link email. Returns True if sent, False if SMTP not configured."""
        if not self._settings.smtp_configured:
            return False

        html = f"""\
<html>
<body style="font-family: system-ui, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto;">
    <h2>¡Hola {display_name}!</h2>
    <p>Bienvenido/a a <strong>Préstamos Sátiros</strong>, la aplicación de préstamo de juegos del Refugio del Sátiro.</p>
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
        msg["Subject"] = "Préstamos Sátiros — Acceso a tu cuenta"
        msg["From"] = self._settings.smtp_from  # type: ignore[assignment]
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(self._settings.smtp_host, self._settings.smtp_port) as server:  # type: ignore[arg-type]
            server.starttls()
            server.login(self._settings.smtp_user, self._settings.smtp_password)  # type: ignore[arg-type]
            server.sendmail(self._settings.smtp_from, to_email, msg.as_string())  # type: ignore[arg-type]

        return True
