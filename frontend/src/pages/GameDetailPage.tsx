import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LoanHistoryEntry } from "../components/LoanHistoryEntry";
import { useAuth } from "../context/AuthContext";
import { useGameHistory } from "../hooks/useGameHistory";
import { Button } from "../ui/Button";
import "./GameDetailPage.css";

export function GameDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { game, history, loading, error, refetch } = useGameHistory(slug);
  const { member } = useAuth();
  const [confirmAction, setConfirmAction] = useState<"borrow" | "return" | null>(null);
  const [acting, setActing] = useState(false);

  if (loading) {
    return (
      <div className="game-detail-page">
        <p className="game-detail-loading">Cargando...</p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="game-detail-page">
        <Link to="/" className="game-detail-back">
          &larr; Volver al catálogo
        </Link>
        <p className="game-detail-error">{error ?? "Juego no encontrado."}</p>
      </div>
    );
  }

  const canBorrow = member !== null && game.status === "available";
  const canReturn =
    member !== null &&
    game.status === "lent" &&
    game.loan_id !== null &&
    (member.is_admin || game.borrower_display_name === member.display_name);

  const handleBorrow = async () => {
    setActing(true);
    try {
      await apiFetch<unknown>("/loans", {
        method: "POST",
        body: JSON.stringify({ game_id: game.id }),
      });
      refetch();
    } catch {
      /* error handled silently — refetch on close keeps UI in sync */
    } finally {
      setActing(false);
      setConfirmAction(null);
    }
  };

  const handleReturn = async () => {
    setActing(true);
    try {
      await apiFetch<unknown>(`/loans/${game.loan_id}/return`, {
        method: "PATCH",
      });
      refetch();
    } catch {
      /* error handled silently — refetch on close keeps UI in sync */
    } finally {
      setActing(false);
      setConfirmAction(null);
    }
  };

  const statusLabel =
    game.status === "available"
      ? "Disponible"
      : game.borrower_display_name
        ? `Prestado a ${game.borrower_display_name}`
        : "Prestado";

  return (
    <div className="game-detail-page">
      <Link to="/" className="game-detail-back">
        &larr; Volver al catálogo
      </Link>

      <div className="game-detail-header">
        <img
          className="game-detail-thumbnail"
          src={game.image_url || game.thumbnail_url}
          alt={game.name}
        />
        <div className="game-detail-info">
          <h1>{game.name}</h1>
          <div className="game-detail-year">{game.year_published}</div>
          <span className={`game-detail-status ${game.status}`}>{statusLabel}</span>
          {(canBorrow || canReturn) && (
            <div className="game-detail-actions">
              {canBorrow && (
                <Button
                  variant="primary"
                  onClick={() => setConfirmAction("borrow")}
                  disabled={acting}
                >
                  Tomar prestado
                </Button>
              )}
              {canReturn && (
                <Button
                  variant="secondary"
                  onClick={() => setConfirmAction("return")}
                  disabled={acting}
                >
                  Devolver
                </Button>
              )}
            </div>
          )}
          <div className="game-detail-bgg">
            <a
              href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver en BoardGameGeek
            </a>
          </div>
        </div>
      </div>

      <div className="game-detail-history">
        <h2>Historial de préstamos</h2>
        {history.length === 0 ? (
          <p className="game-detail-no-history">Este juego nunca ha sido prestado.</p>
        ) : (
          <div className="game-detail-history-list">
            {history.map((entry, i) => (
              <LoanHistoryEntry key={i} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {confirmAction === "borrow" && (
        <ConfirmDialog
          message={`¿Quieres tomar prestado "${game.name}"?`}
          onConfirm={() => void handleBorrow()}
          onCancel={() => setConfirmAction(null)}
          confirmLabel="Tomar prestado"
        />
      )}

      {confirmAction === "return" && (
        <ConfirmDialog
          message={`¿Quieres devolver "${game.name}"?`}
          onConfirm={() => void handleReturn()}
          onCancel={() => setConfirmAction(null)}
          confirmLabel="Devolver"
        />
      )}
    </div>
  );
}
