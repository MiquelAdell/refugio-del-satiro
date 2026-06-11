import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LoanHistoryEntry } from "../components/LoanHistoryEntry";
import { ClockIcon, PlayersIcon } from "../components/MetaIcons";
import { useAuth } from "../context/AuthContext";
import { useCatalogMode } from "../context/CatalogModeContext";
import { useGameHistory } from "../hooks/useGameHistory";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import "./GameDetailPage.css";

export function GameDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { game, history, loading, error, refetch } = useGameHistory(slug);
  const { member } = useAuth();
  const { isGuest } = useCatalogMode();
  const [confirmAction, setConfirmAction] = useState<
    { readonly action: "borrow"; readonly gameId: number } | { readonly action: "return" } | null
  >(null);
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

  const canBorrow = !isGuest && member !== null && game.status === "available";
  const canReturn =
    !isGuest &&
    member !== null &&
    game.status === "lent" &&
    game.loan_id !== null &&
    (member.is_admin || game.borrower_display_name === member.display_name);

  // Hook point for the borrow flow. The sibling change
  // `lending-borrow-with-return-date` replaces the ConfirmDialog this opens
  // with the return-date dialog; until then it keeps the live direct-borrow
  // behaviour (confirm → POST /loans).
  const onBorrow = (gameId: number) => setConfirmAction({ action: "borrow", gameId });

  const handleBorrow = async (gameId: number) => {
    setActing(true);
    try {
      await apiFetch<unknown>("/loans", {
        method: "POST",
        body: JSON.stringify({ game_id: gameId }),
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

      <div className="game-detail-hero">
        <div className="game-detail-cover">
          <img
            className="game-detail-cover-img"
            src={game.image_url || game.thumbnail_url}
            alt={game.name}
          />
        </div>

        <div className="game-detail-info">
          <h1 className="game-detail-name">{game.name}</h1>
          {game.year_published > 0 && (
            <div className="game-detail-year">{game.year_published}</div>
          )}

          <div className="game-detail-meta">
            {game.min_players > 0 && game.max_players > 0 && (
              <span className="game-detail-meta-item">
                <PlayersIcon className="game-detail-meta-icon" />
                {`${game.min_players}-${game.max_players} jugadores`}
              </span>
            )}
            {game.playing_time > 0 && (
              <span className="game-detail-meta-item">
                <ClockIcon className="game-detail-meta-icon" />
                {`${game.playing_time} min`}
              </span>
            )}
          </div>

          <Badge variant={game.status} className="game-detail-status">
            {statusLabel}
          </Badge>

          <div className="game-detail-actions">
            {canBorrow && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => onBorrow(game.id)}
                disabled={acting}
              >
                Solicitar préstamo
              </Button>
            )}
            {canReturn && (
              <Button
                variant="secondary"
                onClick={() => setConfirmAction({ action: "return" })}
                disabled={acting}
              >
                Devolver
              </Button>
            )}
            {isGuest && game.status === "available" && (
              <a href="/prestamos/login" className="game-detail-login-link">
                Iniciar sesión
              </a>
            )}
            {!isGuest && member === null && game.status === "available" && (
              <Link to="/login" className="game-detail-login-link">
                Iniciar sesión
              </Link>
            )}
          </div>

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
        <h2>Historial de préstamos y comentarios</h2>
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

      {confirmAction?.action === "borrow" && (
        <ConfirmDialog
          message={`¿Quieres solicitar el préstamo de "${game.name}"?`}
          onConfirm={() => void handleBorrow(confirmAction.gameId)}
          onCancel={() => setConfirmAction(null)}
          confirmLabel="Solicitar préstamo"
        />
      )}

      {confirmAction?.action === "return" && (
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
