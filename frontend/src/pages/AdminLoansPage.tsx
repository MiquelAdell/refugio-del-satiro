import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAdminActiveLoans } from "../hooks/useAdminActiveLoans";
import { getLoanDetailPath } from "../lib/activeLoan";
import { Badge } from "../ui/Badge";
import { PageTitle } from "../ui/PageTitle";
import type { ActiveLoanItemType } from "../types/loan";
import "./AdminLoansPage.css";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getItemTypeLabel(itemType: ActiveLoanItemType): string {
  return itemType === "boardgame" ? "Juego de mesa" : "Juego de rol";
}

type SortKey = "member_display_name" | "borrowed_at";
type SortDirection = "ascending" | "descending";

export function AdminLoansPage() {
  const { member, loading: authLoading } = useAuth();
  const isAdmin = member?.is_admin === true;
  const { loans, loading, error } = useAdminActiveLoans(isAdmin);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("ascending");

  const handleSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((current) =>
        current === "ascending" ? "descending" : "ascending",
      );
      return;
    }

    setSortKey(nextKey);
    setSortDirection("ascending");
  };

  const sortedLoans = [...loans].sort((first, second) => {
    if (sortKey === null) return 0;

    const comparison =
      sortKey === "member_display_name"
        ? first.member_display_name.localeCompare(second.member_display_name, "es")
        : first.borrowed_at.localeCompare(second.borrowed_at);

    return sortDirection === "ascending" ? comparison : -comparison;
  });

  if (authLoading) {
    return (
      <div className="admin-loans-page">
        <p className="admin-loans-loading">Cargando…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-loans-page">
        <p className="admin-loans-restricted">Acceso restringido a administradores.</p>
      </div>
    );
  }

  return (
    <main className="admin-loans-page">
      <PageTitle>Préstamos activos</PageTitle>

      {loading ? (
        <p className="admin-loans-loading">Cargando…</p>
      ) : error ? (
        <p className="admin-loans-error" role="alert">
          {error}
        </p>
      ) : loans.length === 0 ? (
        <p className="admin-loans-empty">No hay préstamos activos.</p>
      ) : (
        <section className="admin-loans-list" aria-label="Préstamos activos">
          <div className="admin-loans-list-header">
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <div className="admin-loans-sort-controls">
              <button
                type="button"
                aria-sort={
                  sortKey === "member_display_name" ? sortDirection : "none"
                }
                className="admin-loans-sort-button"
                onClick={() => handleSort("member_display_name")}
              >
                Socio
                {sortKey === "member_display_name" && (
                  <span aria-hidden="true">
                    {sortDirection === "ascending" ? " ▲" : " ▼"}
                  </span>
                )}
              </button>
              <button
                type="button"
                aria-sort={sortKey === "borrowed_at" ? sortDirection : "none"}
                className="admin-loans-sort-button"
                onClick={() => handleSort("borrowed_at")}
              >
                Prestado el
                {sortKey === "borrowed_at" && (
                  <span aria-hidden="true">
                    {sortDirection === "ascending" ? " ▲" : " ▼"}
                  </span>
                )}
              </button>
            </div>
          </div>
          {sortedLoans.map((loan) => {
            const detailPath = getLoanDetailPath(loan.item_type, loan.game_slug);

            return (
              <article className="admin-loans-item" key={loan.loan_id}>
                <Link
                  aria-label={`Ver detalles de ${loan.game_name}`}
                  className="admin-loans-cover-link"
                  to={detailPath}
                >
                  <img
                    alt=""
                    className="admin-loans-thumbnail"
                    loading="lazy"
                    src={loan.game_thumbnail_url || loan.game_image_url}
                  />
                </Link>
                <div className="admin-loans-game">
                  <Badge variant="neutral">{getItemTypeLabel(loan.item_type)}</Badge>
                  <Link className="admin-loans-name" to={detailPath}>
                    {loan.game_name}
                  </Link>
                </div>
                <dl className="admin-loans-details">
                  <div aria-label="Socio">
                    <dd>{loan.member_display_name}</dd>
                  </div>
                  <div aria-label="Prestado el">
                    <dd>{formatDate(loan.borrowed_at)}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
