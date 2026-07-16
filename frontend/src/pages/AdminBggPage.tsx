import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/client";
import { Button } from "../ui/Button";
import "./AdminBggPage.css";

type BggStatusResponse = {
  last_imported_at: string | null;
};

type CatalogImportResult = {
  created: number;
  updated: number;
  total: number;
  deleted: number;
  deactivated: number;
  skip_reason: string | null;
};

type CatalogImportOutcome =
  | { result: CatalogImportResult; error: null }
  | { result: null; error: string };

type BggImportResponse = {
  boardgames: CatalogImportOutcome;
  rpg_items: CatalogImportOutcome;
  last_imported_at: string | null;
};

type CatalogOutcomeProps = {
  title: string;
  outcome: CatalogImportOutcome;
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

function CatalogOutcome({ title, outcome }: CatalogOutcomeProps) {
  const headingId = `admin-bgg-${title === "Juegos de mesa" ? "boardgames" : "rpg"}`;

  return (
    <section
      className={`admin-bgg-outcome ${outcome.error ? "admin-bgg-outcome--failed" : ""}`}
      aria-labelledby={headingId}
    >
      <div className="admin-bgg-outcome-heading">
        <h2 id={headingId}>{title}</h2>
        <span className="admin-bgg-outcome-status">
          {outcome.error
            ? "Sincronización fallida"
            : "Sincronización completada"}
        </span>
      </div>

      {outcome.result && (
        <>
          <dl className="admin-bgg-stats">
            <div className="admin-bgg-stat">
              <dt>Nuevos</dt>
              <dd>{outcome.result.created}</dd>
            </div>
            <div className="admin-bgg-stat">
              <dt>Actualizados</dt>
              <dd>{outcome.result.updated}</dd>
            </div>
            <div className="admin-bgg-stat">
              <dt>Eliminados</dt>
              <dd>{outcome.result.deleted}</dd>
            </div>
            <div className="admin-bgg-stat">
              <dt>Ocultados</dt>
              <dd>{outcome.result.deactivated}</dd>
            </div>
            <div className="admin-bgg-stat admin-bgg-stat--total">
              <dt>Total</dt>
              <dd>{outcome.result.total}</dd>
            </div>
          </dl>
          {outcome.result.skip_reason && (
            <p className="admin-bgg-warning" role="alert">
              {outcome.result.skip_reason}
            </p>
          )}
        </>
      )}

      {outcome.error && (
        <p className="admin-bgg-catalog-error" role="alert">
          {outcome.error}
        </p>
      )}
    </section>
  );
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
      setError(
        err instanceof Error
          ? err.message
          : "No se ha podido cargar el estado.",
      );
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
      setError(
        err instanceof Error
          ? err.message
          : "No se ha podido reimportar desde BGG.",
      );
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
          Sincroniza los juegos de mesa de BoardGameGeek y los juegos de rol de
          RPGGeek. Se añadirán los títulos nuevos y se actualizarán los datos de
          los ya existentes.
        </p>
      </header>

      <section className="admin-bgg-actions">
        <Button
          variant="primary"
          onClick={() => void handleImport()}
          disabled={importing}
        >
          {importing ? "Importando…" : "Reimportar desde BGG"}
        </Button>
        <dl className="admin-bgg-status">
          <dt>Última importación</dt>
          <dd>{lastImportedAt ? formatDateTime(lastImportedAt) : "Nunca"}</dd>
        </dl>
      </section>

      {error && (
        <div className="admin-bgg-error" role="alert">
          {error}
        </div>
      )}

      {result && (
        <div
          className="admin-bgg-results"
          aria-label="Resultado de la sincronización"
        >
          <CatalogOutcome title="Juegos de mesa" outcome={result.boardgames} />
          <CatalogOutcome title="Juegos de rol" outcome={result.rpg_items} />
        </div>
      )}
    </div>
  );
}
