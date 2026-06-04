import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../ui/Button";
import "./LoginPage.css";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={(e) => void handleSubmit(e)}>
        <h1>Iniciar sesión</h1>

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
          />
        </div>

        <div className="login-field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>

        <p style={{ marginTop: "var(--space-md)", textAlign: "center", fontSize: "var(--font-size-sm)" }}>
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </p>
      </form>
    </div>
  );
}
