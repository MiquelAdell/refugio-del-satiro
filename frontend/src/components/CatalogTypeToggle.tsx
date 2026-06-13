import { Link, useLocation } from "react-router-dom";
import "./CatalogTypeToggle.css";

export function CatalogTypeToggle() {
  const { pathname } = useLocation();
  const isBoardGames = pathname === "/juegos-de-mesa";
  const isRpg = pathname === "/juegos-de-rol";

  return (
    <nav className="catalog-type-toggle" aria-label="Tipo de catálogo">
      <Link
        to="/juegos-de-mesa"
        className={`catalog-type-toggle-pill${isBoardGames ? " catalog-type-toggle-pill--active" : ""}`}
        aria-current={isBoardGames ? "page" : undefined}
      >
        Juegos de mesa
      </Link>
      <Link
        to="/juegos-de-rol"
        className={`catalog-type-toggle-pill${isRpg ? " catalog-type-toggle-pill--active" : ""}`}
        aria-current={isRpg ? "page" : undefined}
      >
        Libros de rol
      </Link>
    </nav>
  );
}
