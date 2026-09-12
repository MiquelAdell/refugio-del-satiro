import { useState, type FormEvent } from "react";
import { apiFetch } from "../api/client";
import { Button } from "../ui/Button";
import "./ChangePasswordPage.css";

export function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

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
      await apiFetch<{ ok: boolean }>("/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: password,
        }),
      });
      setSuccess(true);
      setCurrentPassword("");
      setPassword("");
      setConfirm("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-page">
      <form className="change-password-form" onSubmit={(e) => void handleSubmit(e)}>
        <h1>Cambiar contraseña</h1>

        {error && <div className="change-password-error">{error}</div>}
        {success && (
          <div className="change-password-success">
            La contraseña se ha cambiado correctamente.
          </div>
        )}

        <div className="change-password-field">
          <label htmlFor="current-password">Contraseña actual</label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <div className="change-password-field">
          <label htmlFor="password">Nueva contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <div className="change-password-field">
          <label htmlFor="confirm">Confirmar nueva contraseña</label>
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
          {loading ? "Cambiando..." : "Cambiar contraseña"}
        </Button>
      </form>
    </div>
  );
}
