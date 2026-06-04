import { useState } from "react";
import { useMyLoans } from "../hooks/useMyLoans";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Button } from "../ui/Button";
import { apiFetch } from "../api/client";
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

  if (loading) {
    return (
      <div className="my-loans-page">
        <h1>Mis préstamos</h1>
        <p className="my-loans-loading">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-loans-page">
        <h1>Mis préstamos</h1>
        <p className="my-loans-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="my-loans-page">
      <h1>Mis préstamos</h1>

      {loans.length === 0 ? (
        <p className="my-loans-empty">No tienes ningún juego en préstamo.</p>
      ) : (
        <div className="my-loans-list">
          {loans.map((loan) => (
            <div key={loan.loan_id} className="my-loans-item">
              <img
                className="my-loans-thumbnail"
                src={loan.game_thumbnail_url}
                alt={loan.game_name}
                loading="lazy"
              />
              <div className="my-loans-info">
                <div className="my-loans-name">{loan.game_name}</div>
                <div className="my-loans-date">{`Tomado prestado el ${formatDate(loan.borrowed_at)}`}</div>
              </div>
              <Button
                variant="secondary"
                onClick={() => setReturning(loan)}
                disabled={actionLoading}
              >
                Devolver
              </Button>
            </div>
          ))}
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
