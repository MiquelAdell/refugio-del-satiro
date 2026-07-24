import { useEffect, useMemo, useState } from "react";
import { CatalogTypeToggle } from "../components/CatalogTypeToggle";
import { CatalogViewToggle } from "../components/CatalogViewToggle";
import { RpgActiveFilterChips } from "../components/RpgActiveFilterChips";
import { RpgFilterPanel } from "../components/RpgFilterPanel";
import {
  persistCatalogView,
  storedCatalogView,
} from "../lib/catalogViewStorage";
import { PoweredByBgg } from "../components/PoweredByBgg";
import { RpgCard } from "../components/RpgCard";
import { SearchBar } from "../components/SearchBar";
import { SearchFiltersBox } from "../components/SearchFiltersBox";
import { useRpgItems } from "../hooks/useRpgItems";
import { computeCategoryFrequency, mostCommonOwnCategory } from "../lib/gameTags";
import { Button } from "../ui/Button";
import { PageTitle } from "../ui/PageTitle";
import {
  applyRpgQuery,
  DEFAULT_RPG_QUERY,
  type RpgQuery,
} from "../types/rpg";
import type { CatalogView } from "../types/catalog";
// Shares the board game catalog layout (page frame, results bar, grid/list).
import "./CatalogPage.css";

export function RpgCatalogPage() {
  const { items, loading, error } = useRpgItems();
  const [query, setQuery] = useState<RpgQuery>(DEFAULT_RPG_QUERY);
  const [view, setView] = useState<CatalogView>(storedCatalogView);

  useEffect(() => {
    persistCatalogView(view);
  }, [view]);

  const filteredItems = useMemo(() => applyRpgQuery(items, query), [items, query]);

  // RPG items carry no `primary_tag`, so the card pill is always the item's
  // own most frequent RPGGeek category, ranked across the loaded catalog.
  const categoryFrequency = useMemo(
    () => computeCategoryFrequency(items),
    [items],
  );

  if (loading) {
    return (
      <div className="catalog-page">
        <p className="catalog-loading">Cargando libros...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="catalog-page">
        <p className="catalog-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="catalog-page">
      <PageTitle>Catálogo</PageTitle>

      <CatalogTypeToggle />

      <SearchFiltersBox
        search={
          <form
            className="catalog-search-form"
            onSubmit={(e) => e.preventDefault()}
          >
            <SearchBar
              value={query.search}
              onChange={(search) => setQuery((q) => ({ ...q, search }))}
              placeholder="Buscar libros..."
            />
            <Button type="submit" disabled={!query.search.trim()}>
              Buscar
            </Button>
          </form>
        }
        filters={<RpgFilterPanel query={query} onChange={setQuery} />}
      />

      <RpgActiveFilterChips query={query} onChange={setQuery} />

      <div className="catalog-results-bar">
        <p className="catalog-count">
          Mostrando {filteredItems.length} de {items.length}
        </p>
        <CatalogViewToggle view={view} onChange={setView} />
      </div>

      {filteredItems.length === 0 ? (
        <p className="catalog-empty">No se han encontrado libros.</p>
      ) : (
        <div className={view === "grid" ? "catalog-grid" : "catalog-list"}>
          {filteredItems.map((item) => (
            <RpgCard
              key={item.id}
              item={item}
              view={view}
              fallbackCategory={mostCommonOwnCategory(
                item.categories,
                categoryFrequency,
              )}
            />
          ))}
        </div>
      )}

      <PoweredByBgg />
    </div>
  );
}
