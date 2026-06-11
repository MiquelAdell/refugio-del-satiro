import { useMemo, useState } from "react";
import { CatalogTypeToggle } from "../components/CatalogTypeToggle";
import { PoweredByBgg } from "../components/PoweredByBgg";
import { RpgCard } from "../components/RpgCard";
import { SearchBar } from "../components/SearchBar";
import { useRpgItems } from "../hooks/useRpgItems";
import { PageTitle } from "../ui/PageTitle";
import { Select } from "../ui/Select";
import {
  applyRpgQuery,
  DEFAULT_RPG_QUERY,
  RPG_SORT_OPTIONS,
  type RpgQuery,
  type RpgSortValue,
} from "../types/rpg";
import "./RpgCatalogPage.css";

export function RpgCatalogPage() {
  const { items, loading, error } = useRpgItems();
  const [query, setQuery] = useState<RpgQuery>(DEFAULT_RPG_QUERY);

  const filteredItems = useMemo(() => applyRpgQuery(items, query), [items, query]);

  if (loading) {
    return (
      <div className="rpg-catalog-page">
        <p className="rpg-catalog-loading">Cargando libros...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rpg-catalog-page">
        <p className="rpg-catalog-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="rpg-catalog-page">
      <PageTitle>Catálogo de libros de rol</PageTitle>

      <CatalogTypeToggle />

      <div className="rpg-catalog-toolbar">
        <SearchBar
          value={query.search}
          onChange={(search) => setQuery((q) => ({ ...q, search }))}
          placeholder="Buscar libros..."
        />
        <Select
          label="Ordenar por"
          value={query.sort}
          options={RPG_SORT_OPTIONS}
          onChange={(e) =>
            setQuery((q) => ({ ...q, sort: e.target.value as RpgSortValue }))
          }
        />
      </div>

      {filteredItems.length === 0 ? (
        <p className="rpg-catalog-empty">No se han encontrado libros.</p>
      ) : (
        <div className="rpg-catalog-grid">
          {filteredItems.map((item) => (
            <RpgCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <PoweredByBgg />
    </div>
  );
}
