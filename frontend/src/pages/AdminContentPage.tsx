import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/client";
import { Button } from "../ui/Button";
import "./AdminContentPage.css";

type SyncStartResponse = {
  started: boolean;
  already_running: boolean;
  started_at: string | null;
};

type SyncStatusResponse = {
  running: boolean;
  started_at: string | null;
  finished_at: string | null;
  event_count: number;
};

type ScraperEvent = {
  kind: string;
  message: string;
  data?: Record<string, unknown>;
};

const EVENT_STREAM_URL = `${
  import.meta.env.VITE_API_URL ?? "/prestamos/api"
}/admin/content/events`;

export function AdminContentPage() {
  const { member, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<SyncStatusResponse | null>(null);
  const [events, setEvents] = useState<ScraperEvent[]>([]);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiFetch<SyncStatusResponse>("/admin/content/status");
      setStatus(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No s'ha pogut carregar l'estat.");
    }
  }, []);

  const connectStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    const source = new EventSource(EVENT_STREAM_URL, { withCredentials: true });
    eventSourceRef.current = source;

    const KINDS = [
      "run-started",
      "urls-enumerated",
      "page-fetched",
      "page-skipped",
      "page-stripped",
      "page-written",
      "asset-downloaded",
      "asset-reused",
      "warning",
      "error",
      "run-finished",
    ] as const;

    for (const kind of KINDS) {
      source.addEventListener(kind, (event) => {
        const payload = JSON.parse((event as MessageEvent).data) as ScraperEvent;
        setEvents((prev) => [...prev, payload]);
      });
    }
    source.addEventListener("done", () => {
      source.close();
      void fetchStatus();
    });
    source.onerror = () => {
      source.close();
    };
  }, [fetchStatus]);

  useEffect(() => {
    if (!member?.is_admin) return;
    void fetchStatus();
    connectStream();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [member, fetchStatus, connectStream]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [events]);

  const handleStart = async () => {
    setStarting(true);
    setError(null);
    try {
      const res = await apiFetch<SyncStartResponse>("/admin/content/resync", {
        method: "POST",
      });
      if (res.already_running) {
        setError("Ja hi ha un sync en marxa.");
      } else {
        setEvents([]);
        connectStream();
        await fetchStatus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No s'ha pogut iniciar el sync.");
    } finally {
      setStarting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="admin-content-page">
        <p>Carregant…</p>
      </div>
    );
  }

  if (!member?.is_admin) {
    return (
      <div className="admin-content-page">
        <p>Accés restringit a administradors.</p>
      </div>
    );
  }

  const running = status?.running === true;

  return (
    <div className="admin-content-page">
      <header>
        <h1>Resincronitzar contingut</h1>
        <p className="admin-content-description">
          Extrau les pàgines públiques de Google Sites i actualitza el mirror
          servit per Caddy. Els canvis són visibles immediatament al VPS. Per
          persistir-los al repositori, executa <code>python -m scraper run</code>
          en local i fes commit manualment.
        </p>
      </header>

      <section className="admin-content-actions">
        <Button
          variant="primary"
          onClick={() => void handleStart()}
          disabled={running || starting}
        >
          {running ? "En marxa…" : starting ? "Iniciant…" : "Iniciar resync"}
        </Button>
        {status && (
          <dl className="admin-content-status">
            {status.started_at && (
              <>
                <dt>Iniciat</dt>
                <dd>{status.started_at}</dd>
              </>
            )}
            {status.finished_at && (
              <>
                <dt>Finalitzat</dt>
                <dd>{status.finished_at}</dd>
              </>
            )}
            <dt>Esdeveniments</dt>
            <dd>{status.event_count}</dd>
          </dl>
        )}
      </section>

      {error && <div className="admin-content-error">{error}</div>}

      <section className="admin-content-log-section">
        <h2>Log</h2>
        <div ref={logRef} className="admin-content-log">
          {events.length === 0 ? (
            <p className="admin-content-log-empty">
              Cap esdeveniment encara. Inicia un sync per veure el progrés.
            </p>
          ) : (
            events.map((event, i) => (
              <div
                key={i}
                className={`admin-content-log-entry admin-content-log-entry--${event.kind}`}
              >
                <span className="admin-content-log-kind">{event.kind}</span>
                <span className="admin-content-log-message">{event.message}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
