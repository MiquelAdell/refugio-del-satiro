import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { Button } from "../ui/Button";
import "./SetPasswordPage.css";

export function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Token no válido o ausente.");
      return;
    }

    if (password.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch<{ ok: boolean }>("/set-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="set-password-page">
        <div className="set-password-form">
          <h1>Contraseña establecida</h1>
          <div className="set-password-success">
            La contraseña se ha establecido correctamente.{" "}
            <Link to="/login">Inicia sesión</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="set-password-page">
      <form className="set-password-form" onSubmit={(e) => void handleSubmit(e)}>
        <h1>Establecer contraseña</h1>

        {error && <div className="set-password-error">{error}</div>}

        <div className="set-password-field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <div className="set-password-field">
          <label htmlFor="confirm">Confirmar contraseña</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? "Estableciendo..." : "Establecer contraseña"}
        </Button>
      </form>
    </div>
  );
}
