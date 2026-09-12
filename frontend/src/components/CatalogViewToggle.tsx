import type { CatalogView } from "../types/catalog";

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <circle cx="4" cy="6" r="1.8" />
      <circle cx="4" cy="12" r="1.8" />
      <circle cx="4" cy="18" r="1.8" />
      <rect x="8" y="4.8" width="13" height="2.4" rx="1.2" />
      <rect x="8" y="10.8" width="13" height="2.4" rx="1.2" />
      <rect x="8" y="16.8" width="13" height="2.4" rx="1.2" />
    </svg>
  );
}

interface CatalogViewToggleProps {
  readonly view: CatalogView;
  readonly onChange: (view: CatalogView) => void;
}

export function CatalogViewToggle({ view, onChange }: CatalogViewToggleProps) {
  return (
    <div className="catalog-view-toggle" role="group" aria-label="Modo de vista">
      <button
        type="button"
        className={view === "list" ? "active" : ""}
        aria-pressed={view === "list"}
        aria-label="Vista de lista"
        title="Vista de lista"
        onClick={() => onChange("list")}
      >
        <ListIcon />
      </button>
      <button
        type="button"
        className={view === "grid" ? "active" : ""}
        aria-pressed={view === "grid"}
        aria-label="Vista de cuadrícula"
        title="Vista de cuadrícula"
        onClick={() => onChange("grid")}
      >
        <GridIcon />
      </button>
    </div>
  );
}
