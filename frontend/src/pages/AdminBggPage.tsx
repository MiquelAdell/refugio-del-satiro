import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/client";
import { Button } from "../ui/Button";
import "./AdminBggPage.css";

type BggStatusResponse = {
  last_imported_at: string | null;
};

type BggImportResponse = {
  created: number;
  updated: number;
  total: number;
  deleted: number;
  deactivated: number;
  skip_reason: string | null;
  last_imported_at: string | null;
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminBggPage() {
  const { member, loading: authLoading } = useAuth();
  const [lastImportedAt, setLastImportedAt] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<BggImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiFetch<BggStatusResponse>("/admin/bgg/status");
      setLastImportedAt(res.last_imported_at);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se ha podido cargar el estado.");
    }
  }, []);

  useEffect(() => {
    if (!member?.is_admin) return;
    void fetchStatus();
  }, [member, fetchStatus]);

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiFetch<BggImportResponse>("/admin/bgg/import", {
        method: "POST",
      });
      setResult(res);
      setLastImportedAt(res.last_imported_at);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se ha podido reimportar desde BGG.");
    } finally {
      setImporting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="admin-bgg-page">
        <p>Cargando…</p>
      </div>
    );
  }

  if (!member?.is_admin) {
    return (
      <div className="admin-bgg-page">
        <p>Acceso restringido a administradores.</p>
      </div>
    );
  }

  return (
    <div className="admin-bgg-page">
      <header>
        <h1>Datos BGG</h1>
        <p className="admin-bgg-description">
          Reimporta la colección de juegos desde BoardGameGeek (BGG). Da de alta los
          juegos nuevos y actualiza el nombre, la imagen y el año de publicación de
          los ya existentes.
        </p>
      </header>

      <section className="admin-bgg-actions">
        <Button variant="primary" onClick={() => void handleImport()} disabled={importing}>
          {importing ? "Importando…" : "Reimportar desde BGG"}
        </Button>
        <dl className="admin-bgg-status">
          <dt>Última importación</dt>
          <dd>{lastImportedAt ? formatDateTime(lastImportedAt) : "Nunca"}</dd>
        </dl>
      </section>

      {error && <div className="admin-bgg-error">{error}</div>}

      {result && (
        <p className="admin-bgg-result">
          {result.created} nuevos, {result.updated} actualizados, {result.deleted}{" "}
          eliminados, {result.deactivated} ocultados (prestados), {result.total} en
          total.
        </p>
      )}

      {result?.skip_reason && (
        <p className="admin-bgg-error">{result.skip_reason}</p>
      )}
    </div>
  );
}
