import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LoanActionFeedback } from "../components/LoanActionFeedback";
import { LoanHistoryEntry } from "../components/LoanHistoryEntry";
import { useAuth } from "../context/AuthContext";
import { useRpgHistory } from "../hooks/useRpgHistory";
import { useMyLoans } from "../hooks/useMyLoans";
import { displayDescription } from "../lib/description";
import {
  BORROW_SUCCESS_MESSAGE,
  getReturnAction,
} from "../lib/loanActions";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import "./RpgDetailPage.css";

export function RpgDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { item, history, loading, error, refetch } = useRpgHistory(slug);
  const { member } = useAuth();
  const {
    loans: myLoans,
    loading: myLoansLoading,
    error: myLoansError,
    refetch: refetchMyLoans,
  } = useMyLoans(member !== null);
  const [confirmAction, setConfirmAction] = useState<
    | { readonly action: "borrow"; readonly itemId: number }
    | { readonly action: "return" }
    | null
  >(null);
  const [acting, setActing] = useState(false);
  const [loanFeedback, setLoanFeedback] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="rpg-detail-page">
        <p className="rpg-detail-loading">Cargando...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="rpg-detail-page">
        <Link to="/juegos-de-rol" className="rpg-detail-back">
          &larr; Volver al catálogo
        </Link>
        <p className="rpg-detail-error">{error ?? "Libro no encontrado."}</p>
      </div>
    );
  }

  const canBorrow = member !== null && item.status === "available";
  const activeLoanIds = new Set(myLoans.map((loan) => loan.loan_id));
  const returnAction =
    !myLoansLoading && myLoansError === null
      ? getReturnAction(member, item, activeLoanIds)
      : null;

  const onBorrow = (itemId: number) =>
    setConfirmAction({ action: "borrow", itemId });

  const handleBorrow = async (itemId: number) => {
    setActing(true);
    try {
      await apiFetch<unknown>("/loans", {
        method: "POST",
        body: JSON.stringify({ game_id: itemId }),
      });
      setLoanFeedback(BORROW_SUCCESS_MESSAGE);
      refetch();
      refetchMyLoans();
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
      await apiFetch<unknown>(`/loans/${item.loan_id}/return`, {
        method: "PATCH",
      });
      refetch();
      refetchMyLoans();
    } catch {
      /* error handled silently — refetch on close keeps UI in sync */
    } finally {
      setActing(false);
      setConfirmAction(null);
    }
  };

  const statusLabel =
    item.status === "available"
      ? "Disponible"
      : item.borrower_display_name
        ? `Prestado a ${item.borrower_display_name}`
        : "Prestado";

  const descriptionParagraphs = displayDescription(item)
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <div className="rpg-detail-page">
      <Link to="/juegos-de-rol" className="rpg-detail-back">
        &larr; Volver al catálogo
      </Link>

      <div className="rpg-detail-hero">
        <div className="rpg-detail-cover">
          <img
            className="rpg-detail-cover-img"
            src={item.image_url || item.thumbnail_url}
            alt={item.name}
          />
        </div>

        <div className="rpg-detail-info">
          <h1 className="rpg-detail-name">{item.name}</h1>
          {item.year_published > 0 && (
            <div className="rpg-detail-year">{item.year_published}</div>
          )}
          {item.bgg_rating > 0 && (
            <div className="rpg-detail-rating">
              <span className="rpg-detail-rating-label">Valoración BGG:</span>
              <span className="rpg-detail-rating-value">
                {item.bgg_rating.toFixed(1)}
              </span>
            </div>
          )}

          {(item.categories.length > 0 ||
            item.publication_types.length > 0) && (
            <dl className="rpg-detail-classifications">
              {item.categories.length > 0 && (
                <div>
                  <dt>Categorías</dt>
                  <dd>{item.categories.join(", ")}</dd>
                </div>
              )}
              {item.publication_types.length > 0 && (
                <div>
                  <dt>Tipo de publicación</dt>
                  <dd>{item.publication_types.join(", ")}</dd>
                </div>
              )}
            </dl>
          )}

          <Badge
            variant={item.status === "available" ? "available" : "lent"}
            className="rpg-detail-status"
          >
            {statusLabel}
          </Badge>

          <div className="rpg-detail-actions">
            {canBorrow && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => onBorrow(item.id)}
                disabled={acting}
              >
                Solicitar préstamo
              </Button>
            )}
            {returnAction && (
              <Button
                variant="secondary"
                onClick={() => setConfirmAction({ action: "return" })}
                disabled={acting}
              >
                {returnAction.label}
              </Button>
            )}
            {member === null && item.status === "available" && (
              <Link to="/login" className="rpg-detail-login-link">
                Iniciar sesión
              </Link>
            )}
          </div>

          <LoanActionFeedback message={loanFeedback} />

          <div className="rpg-detail-bgg">
            <a
              href={`https://rpggeek.com/rpgitem/${item.bgg_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver en RPGGeek
            </a>
          </div>
        </div>
      </div>

      {descriptionParagraphs.length > 0 && (
        <section className="rpg-detail-description" aria-label="Descripción">
          {descriptionParagraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </section>
      )}

      <div className="rpg-detail-history">
        <h2>Historial de préstamos y comentarios</h2>
        {history.length === 0 ? (
          <p className="rpg-detail-no-history">
            Este libro nunca ha sido prestado.
          </p>
        ) : (
          <div className="rpg-detail-history-list">
            {history.map((entry, i) => (
              <LoanHistoryEntry key={i} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {confirmAction?.action === "borrow" && (
        <ConfirmDialog
          message={`¿Quieres solicitar el préstamo de "${item.name}"?`}
          onConfirm={() => void handleBorrow(confirmAction.itemId)}
          onCancel={() => setConfirmAction(null)}
          confirmLabel="Solicitar préstamo"
        />
      )}

      {confirmAction?.action === "return" && (
        <ConfirmDialog
          message={`¿Quieres devolver "${item.name}"?`}
          onConfirm={() => void handleReturn()}
          onCancel={() => setConfirmAction(null)}
          confirmLabel={returnAction?.label ?? "Devolver"}
        />
      )}
    </div>
  );
}
