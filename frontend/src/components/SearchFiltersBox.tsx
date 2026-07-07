import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import "./SearchFiltersBox.css";

interface SearchFiltersBoxProps {
  readonly search: ReactNode;
  readonly filters: ReactNode;
}

const tabs = ["buscador", "filtros"] as const;
type TabId = (typeof tabs)[number];

const TAB_LABELS: Record<TabId, string> = {
  buscador: "Buscador",
  filtros: "Filtros",
};

export function SearchFiltersBox({ search, filters }: SearchFiltersBoxProps) {
  const [active, setActive] = useState<TabId>("buscador");
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    buscador: null,
    filtros: null,
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

    e.preventDefault();
    const currentIndex = tabs.indexOf(active);
    const delta = e.key === "ArrowRight" ? 1 : -1;
    const nextTab = tabs[(currentIndex + delta + tabs.length) % tabs.length];

    setActive(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  return (
    <div className="search-filters-box">
      <div className="search-filters-box-tabs" role="tablist" aria-label="Buscar y filtrar">
        {tabs.map((tab) => (
          <button
            key={tab}
            ref={(el) => {
              tabRefs.current[tab] = el;
            }}
            type="button"
            role="tab"
            id={`search-filters-tab-${tab}`}
            aria-selected={active === tab}
            aria-controls={`search-filters-panel-${tab}`}
            tabIndex={active === tab ? 0 : -1}
            className={active === tab ? "active" : ""}
            onClick={() => setActive(tab)}
            onKeyDown={handleKeyDown}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div
        id="search-filters-panel-buscador"
        role="tabpanel"
        aria-labelledby="search-filters-tab-buscador"
        className="search-filters-box-panel"
        hidden={active !== "buscador"}
      >
        {search}
      </div>

      <div
        id="search-filters-panel-filtros"
        role="tabpanel"
        aria-labelledby="search-filters-tab-filtros"
        className="search-filters-box-panel"
        hidden={active !== "filtros"}
      >
        {filters}
      </div>
    </div>
  );
}
