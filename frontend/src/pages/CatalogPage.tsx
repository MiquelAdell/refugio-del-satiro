import { useEffect, useMemo, useState } from "react";
import { useGames } from "../hooks/useGames";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { ActiveFilterChips } from "../components/ActiveFilterChips";
import { FilterPanel } from "../components/FilterPanel";
import { GameCard } from "../components/GameCard";
import { SearchBar } from "../components/SearchBar";
import { Button } from "../ui/Button";
import { PageTitle } from "../ui/PageTitle";
import {
  applyCatalogQuery,
  catalogViews,
  DEFAULT_CATALOG_QUERY,
  type CatalogQuery,
  type CatalogView,
} from "../types/catalog";
import "./CatalogPage.css";

const SIDEBAR_MQ = "(min-width: 1024px)";
// DQ-2: the member's grid/list choice persists across reloads.
const VIEW_STORAGE_KEY = "catalog-view-mode";

function storedView(): CatalogView {
  const value = localStorage.getItem(VIEW_STORAGE_KEY);
  return catalogViews.includes(value as CatalogView)
    ? (value as CatalogView)
    : "grid";
}

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

interface ViewToggleProps {
  readonly view: CatalogView;
  readonly onChange: (view: CatalogView) => void;
}

function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="catalog-view-toggle" role="group" aria-label="Modo de vista">
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
    </div>
  );
}

export function CatalogPage() {
  const { games, loading, error } = useGames();
  const [query, setQuery] = useState<CatalogQuery>(DEFAULT_CATALOG_QUERY);
  const [view, setView] = useState<CatalogView>(storedView);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sidebarMode = useMediaQuery(SIDEBAR_MQ);

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  const hasPlayerData = useMemo(
    () => games.some((g) => g.min_players > 0),
    [games],
  );
  const hasTimeData = useMemo(
    () => games.some((g) => g.playing_time > 0),
    [games],
  );

  const filteredGames = useMemo(
    () => applyCatalogQuery(games, query),
    [games, query],
  );

  if (loading) {
    return (
      <div className="catalog-page">
        <p className="catalog-loading">Cargando juegos...</p>
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

  const filterPanel = (
    <FilterPanel
      query={query}
      onChange={setQuery}
      hasPlayerData={hasPlayerData}
      hasTimeData={hasTimeData}
    />
  );

  return (
    <div className="catalog-page">
      <PageTitle>Catálogo de juegos</PageTitle>

      <div className="catalog-layout">
        {sidebarMode && (
          <aside className="catalog-sidebar" aria-label="Filtros">
            {filterPanel}
          </aside>
        )}

        <div className="catalog-main">
          <div className="catalog-toolbar">
            <SearchBar
              value={query.search}
              onChange={(search) => setQuery((q) => ({ ...q, search }))}
            />
            {!sidebarMode && (
              <Button
                variant="secondary"
                onClick={() => setDrawerOpen(true)}
                aria-expanded={drawerOpen}
                aria-controls="catalog-filter-drawer"
              >
                Filtros
              </Button>
            )}
            <ViewToggle view={view} onChange={setView} />
          </div>

          <ActiveFilterChips query={query} onChange={setQuery} />

          {filteredGames.length === 0 ? (
            <p className="catalog-empty">No se han encontrado juegos.</p>
          ) : (
            <div className={view === "grid" ? "catalog-grid" : "catalog-list"}>
              {filteredGames.map((game) => (
                <GameCard key={game.id} game={game} view={view} />
              ))}
            </div>
          )}
        </div>
      </div>

      {!sidebarMode && drawerOpen && (
        <div
          className="catalog-drawer-overlay"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            id="catalog-filter-drawer"
            className="catalog-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Filtros"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="catalog-drawer-header">
              <span className="catalog-drawer-title">Filtros</span>
              <button
                type="button"
                className="catalog-drawer-close"
                aria-label="Cerrar filtros"
                onClick={() => setDrawerOpen(false)}
              >
                ×
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      )}
    </div>
  );
}
