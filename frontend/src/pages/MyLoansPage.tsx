import { useState } from "react";
import { Link } from "react-router-dom";
import { useMyLoans } from "../hooks/useMyLoans";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Button } from "../ui/Button";
import { PageTitle } from "../ui/PageTitle";
import { apiFetch } from "../api/client";
import {
  getLoanDetailPath,
  isLoanAtLeastThirtyDaysOld,
} from "../lib/activeLoan";
import { BORROW_SUCCESS_MESSAGE } from "../lib/loanActions";
import type { ActiveLoan } from "../types/loan";
import "./MyLoansPage.css";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function MyLoansPage() {
  const { loans, loading, error, refetch } = useMyLoans();
  const [returning, setReturning] = useState<ActiveLoan | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleReturn = async (loan: ActiveLoan) => {
    setActionLoading(true);
    try {
      await apiFetch<unknown>(`/loans/${loan.loan_id}/return`, {
        method: "PATCH",
      });
      refetch();
    } catch {
      /* silently handle — list will refetch */
    } finally {
      setActionLoading(false);
      setReturning(null);
    }
  };

  return (
    <div className="my-loans-page">
      <PageTitle>Mis préstamos</PageTitle>
      <p className="my-loans-guidance">{BORROW_SUCCESS_MESSAGE}</p>

      {loading ? (
        <p className="my-loans-loading">Cargando...</p>
      ) : error ? (
        <p className="my-loans-error">{error}</p>
      ) : loans.length === 0 ? (
        <p className="my-loans-empty">No tienes ningún juego en préstamo.</p>
      ) : (
        <div className="my-loans-list">
          {loans.map((loan) => {
            const detailPath = getLoanDetailPath(
              loan.item_type,
              loan.game_slug,
            );

            return (
              <article key={loan.loan_id} className="my-loans-item">
                <Link
                  to={detailPath}
                  className="my-loans-cover-link"
                  aria-label={`Ver detalles de ${loan.game_name}`}
                >
                  <img
                    className="my-loans-thumbnail"
                    src={loan.game_thumbnail_url}
                    alt=""
                    loading="lazy"
                  />
                </Link>
                <div className="my-loans-info">
                  <Link to={detailPath} className="my-loans-name">
                    {loan.game_name}
                  </Link>
                  <div className="my-loans-date">{`Tomado prestado el ${formatDate(loan.borrowed_at)}`}</div>
                  {isLoanAtLeastThirtyDaysOld(loan.borrowed_at) && (
                    <p className="my-loans-age-notice">
                      Lleva 30 días o más en préstamo.
                    </p>
                  )}
                </div>
                <Button
                  className="my-loans-return"
                  variant="secondary"
                  onClick={() => setReturning(loan)}
                  disabled={actionLoading}
                >
                  Devolver
                </Button>
              </article>
            );
          })}
        </div>
      )}

      {returning && (
        <ConfirmDialog
          message={`¿Quieres devolver "${returning.game_name}"?`}
          onConfirm={() => void handleReturn(returning)}
          onCancel={() => setReturning(null)}
          confirmLabel="Devolver"
        />
      )}
    </div>
  );
}
