import { useEffect } from "react";

const SUPPORT_EMAIL = "refugiodelsatiro+prestamos@gmail.com";
const SUPPORT_SUBJECT = "Incidencia con un prestamo";
const SUPPORT_EMAIL_URL = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(SUPPORT_SUBJECT)}`;

export function EmailSupportPage() {
  useEffect(() => {
    window.location.assign(SUPPORT_EMAIL_URL);
  }, []);

  return (
    <div className="login-page">
      <main className="login-form">
        <h1>Contactar por correo</h1>
        <p style={{ lineHeight: 1.5, marginBottom: "var(--space-md)" }}>
          Estamos abriendo tu aplicación de correo.
        </p>
        <p style={{ lineHeight: 1.5, marginBottom: "var(--space-md)" }}>
          Si no se abre, toca el enlace:
        </p>
        <p style={{ margin: 0 }}>
          <a href={SUPPORT_EMAIL_URL}>{SUPPORT_EMAIL}</a>
        </p>
      </main>
    </div>
  );
}
