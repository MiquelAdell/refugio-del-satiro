import { Select } from "../ui/Select";
import type { CatalogView } from "../types/catalog";
import { CatalogViewToggle } from "./CatalogViewToggle";
import "./CatalogResultsBar.css";

interface SortOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

interface CatalogResultsBarProps<T extends string> {
  readonly shown: number;
  readonly total: number;
  readonly sort: T;
  readonly sortOptions: readonly SortOption<T>[];
  readonly onSortChange: (sort: T) => void;
  readonly view: CatalogView;
  readonly onViewChange: (view: CatalogView) => void;
}

export function CatalogResultsBar<T extends string>({
  shown,
  total,
  sort,
  sortOptions,
  onSortChange,
  view,
  onViewChange,
}: CatalogResultsBarProps<T>) {
  return (
    <div className="catalog-results-bar">
      <p
        className="catalog-count"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        Mostrando {shown} de {total}
      </p>
      <div className="catalog-results-controls">
        <Select
          label="Ordenar por"
          options={sortOptions}
          value={sort}
          onChange={(event) => onSortChange(event.target.value as T)}
        />
        <CatalogViewToggle view={view} onChange={onViewChange} />
      </div>
    </div>
  );
}
