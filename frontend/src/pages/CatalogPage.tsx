import { useEffect, useMemo, useState } from "react";
import { useGames } from "../hooks/useGames";
import { ActiveFilterChips } from "../components/ActiveFilterChips";
import { CatalogTypeToggle } from "../components/CatalogTypeToggle";
import { CatalogResultsBar } from "../components/CatalogResultsBar";
import {
  persistCatalogView,
  storedCatalogView,
} from "../lib/catalogViewStorage";
import { FilterPanel } from "../components/FilterPanel";
import { GameCard } from "../components/GameCard";
import { PoweredByBgg } from "../components/PoweredByBgg";
import { SearchBar } from "../components/SearchBar";
import { SearchFiltersBox } from "../components/SearchFiltersBox";
import {
  computeCategoryFrequency,
  mostCommonOwnCategory,
} from "../lib/gameTags";
import { Button } from "../ui/Button";
import { PageTitle } from "../ui/PageTitle";
import {
  applyCatalogQuery,
  DEFAULT_CATALOG_QUERY,
  SORT_OPTIONS,
  type CatalogQuery,
  type CatalogView,
} from "../types/catalog";
import "./CatalogPage.css";

export function CatalogPage() {
  const { games, loading, error } = useGames();
  const [query, setQuery] = useState<CatalogQuery>(DEFAULT_CATALOG_QUERY);
  const [view, setView] = useState<CatalogView>(storedCatalogView);

  useEffect(() => {
    persistCatalogView(view);
  }, [view]);

  const hasPlayerData = useMemo(
    () => games.some((g) => g.min_players > 0),
    [games],
  );
  const hasAgeData = useMemo(() => games.some((g) => g.min_age > 0), [games]);
  const hasTimeData = useMemo(
    () => games.some((g) => g.playing_time > 0),
    [games],
  );

  const filteredGames = useMemo(
    () => applyCatalogQuery(games, query),
    [games, query],
  );

  // Fallback tag for cards without a `primary_tag`: the game's own most
  // frequent BGG category, ranked across the whole loaded catalog.
  const categoryFrequency = useMemo(
    () => computeCategoryFrequency(games),
    [games],
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
      hasAgeData={hasAgeData}
      hasTimeData={hasTimeData}
    />
  );

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
              placeholder="Buscar juego por nombre..."
            />
            <Button type="submit" disabled={!query.search.trim()}>
              Buscar
            </Button>
          </form>
        }
        filters={filterPanel}
      />

      <ActiveFilterChips query={query} onChange={setQuery} />

      <CatalogResultsBar
        shown={filteredGames.length}
        total={games.length}
        sort={query.sort}
        sortOptions={SORT_OPTIONS}
        onSortChange={(sort) => setQuery((current) => ({ ...current, sort }))}
        view={view}
        onViewChange={setView}
      />

      {filteredGames.length === 0 ? (
        <p className="catalog-empty">No se han encontrado juegos.</p>
      ) : (
        <div className={view === "grid" ? "catalog-grid" : "catalog-list"}>
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              view={view}
              fallbackCategory={
                game.primary_tag
                  ? undefined
                  : mostCommonOwnCategory(game.categories, categoryFrequency)
              }
            />
          ))}
        </div>
      )}

      <PoweredByBgg />
    </div>
  );
}
