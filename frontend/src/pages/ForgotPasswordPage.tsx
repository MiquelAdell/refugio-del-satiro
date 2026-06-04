import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { Button } from "../ui/Button";
import "./LoginPage.css";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch("/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch {
      setError("Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="login-page">
        <div className="login-form">
          <h1>Recuperar contraseña</h1>
          <p style={{ marginBottom: "var(--space-md)", lineHeight: 1.5 }}>
            Si existe una cuenta con ese correo electrónico, hemos enviado un enlace para restablecer la contraseña. Revisa tu bandeja de entrada.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate("/login")}
            style={{ display: "block", width: "100%" }}
          >
            Volver a iniciar sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={(e) => void handleSubmit(e)}>
        <h1>Recuperar contraseña</h1>

        <p style={{ marginBottom: "var(--space-md)", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
          Introduce tu correo electrónico y te enviaremos un enlace para restablecer la contraseña.
        </p>

        {error && <div className="login-error">{error}</div>}

        <div className="login-field">
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? "Enviando..." : "Enviar"}
        </Button>

        <p style={{ marginTop: "var(--space-md)", textAlign: "center", fontSize: "var(--font-size-sm)" }}>
          <Link to="/login">Volver a iniciar sesión</Link>
        </p>
      </form>
    </div>
  );
}
