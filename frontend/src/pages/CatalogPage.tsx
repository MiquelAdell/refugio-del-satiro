import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGames } from "../hooks/useGames";
import { GameCard } from "../components/GameCard";
import { SearchBar } from "../components/SearchBar";
import { FilterControl, type FilterValue } from "../components/FilterControl";
import type { GameWithStatus } from "../types/game";
import "./CatalogPage.css";

type SortValue = "name-asc" | "name-desc" | "rating" | "players-asc" | "players-desc" | "time-asc" | "time-desc";
type LocationValue = "all" | "armari" | "soterrani";
type TimePreset = "all" | "lt30" | "30to60" | "1to2h" | "2hplus";

const SORT_OPTIONS: readonly { readonly value: SortValue; readonly label: string }[] = [
  { value: "name-asc", label: "Nombre (A-Z)" },
  { value: "name-desc", label: "Nombre (Z-A)" },
  { value: "rating", label: "Valoración BGG (alta a baja)" },
  { value: "players-asc", label: "Jugadores (menos a más)" },
  { value: "players-desc", label: "Jugadores (más a menos)" },
  { value: "time-asc", label: "Tiempo de juego (corto a largo)" },
  { value: "time-desc", label: "Tiempo de juego (largo a corto)" },
];

const LOCATION_OPTIONS: readonly { readonly value: LocationValue; readonly label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "armari", label: "Armario" },
  { value: "soterrani", label: "Sótano" },
];

const TIME_PRESETS: readonly { readonly value: TimePreset; readonly label: string }[] = [
  { value: "all", label: "Todo" },
  { value: "lt30", label: "< 30 min" },
  { value: "30to60", label: "30-60 min" },
  { value: "1to2h", label: "1-2h" },
  { value: "2hplus", label: "2h+" },
];

function stripPunctuation(name: string): string {
  return name.replace(/[¡¿!?«»()'".,;:]/g, "").trim();
}

function matchesTimePreset(playingTime: number, preset: TimePreset): boolean {
  switch (preset) {
    case "all":
      return true;
    case "lt30":
      return playingTime > 0 && playingTime < 30;
    case "30to60":
      return playingTime >= 30 && playingTime <= 60;
    case "1to2h":
      return playingTime > 60 && playingTime <= 120;
    case "2hplus":
      return playingTime > 120;
  }
}

const DESKTOP_MQ = "(min-width: 641px)";

export function CatalogPage() {
  const { games, loading, error } = useGames();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [location, setLocation] = useState<LocationValue>("all");
  const [sort, setSort] = useState<SortValue>("name-asc");
  const [sortOpen, setSortOpen] = useState(false);
  const [timePreset, setTimePreset] = useState<TimePreset>("all");
  const [minRating, setMinRating] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(() => window.matchMedia(DESKTOP_MQ).matches);
  const sortRef = useRef<HTMLDivElement>(null);

  const playerBounds = useMemo(() => {
    return { min: 1, max: 12 };
  }, []);

  const [playersMin, setPlayersMin] = useState<number | null>(null);
  const [playersMax, setPlayersMax] = useState<number | null>(null);

  const effectiveMin = playersMin ?? playerBounds.min;
  const effectiveMax = playersMax ?? playerBounds.max;

  const hasPlayerData = useMemo(
    () => games.some((g) => g.min_players > 0),
    [games],
  );
  const hasTimeData = useMemo(
    () => games.some((g) => g.playing_time > 0),
    [games],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sort !== "name-asc") count++;
    if (filter !== "all") count++;
    if (location !== "all") count++;
    if (timePreset !== "all") count++;
    if (minRating > 0) count++;
    const pMinActive = effectiveMin > playerBounds.min;
    const pMaxActive = effectiveMax < playerBounds.max;
    if (pMinActive || pMaxActive) count++;
    return count;
  }, [sort, filter, location, timePreset, minRating, effectiveMin, effectiveMax, playerBounds]);

  useEffect(() => {
    if (!sortOpen) return;
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sortOpen]);

  const handleSortSelect = useCallback((value: SortValue) => {
    setSort(value);
    setSortOpen(false);
  }, []);

  const handlePlayersMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      setPlayersMin(Math.min(val, effectiveMax));
    },
    [effectiveMax],
  );

  const handlePlayersMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      setPlayersMax(Math.max(val, effectiveMin));
    },
    [effectiveMin],
  );

  const filteredGames = useMemo(() => {
    let result: readonly GameWithStatus[] = games;

    if (filter === "available") {
      result = result.filter((g) => g.status === "available");
    } else if (filter === "lent") {
      result = result.filter((g) => g.status === "lent");
    }

    if (location !== "all") {
      result = result.filter((g) => g.location === location);
    }

    if (search.trim() !== "") {
      const query = search.trim().toLowerCase();
      result = result.filter((g) => g.name.toLowerCase().includes(query));
    }

    const pMin = effectiveMin;
    const pMax = effectiveMax;
    const isAtExtremes = pMin <= playerBounds.min && pMax >= playerBounds.max;
    if (!isAtExtremes) {
      result = result.filter((g) => {
        if (g.min_players <= 0 && g.max_players <= 0) return false;
        const effectivePMax = pMax >= 12 ? Infinity : pMax;
        if (g.min_players > effectivePMax) return false;
        if (g.max_players > 0 && g.max_players < pMin) return false;
        return true;
      });
    }

    if (timePreset !== "all") {
      result = result.filter((g) => matchesTimePreset(g.playing_time, timePreset));
    }

    if (minRating > 0) {
      result = result.filter((g) => g.bgg_rating >= minRating);
    }

    const sorted = [...result];
    switch (sort) {
      case "name-asc":
        sorted.sort((a, b) =>
          stripPunctuation(a.name).localeCompare(stripPunctuation(b.name)),
        );
        break;
      case "name-desc":
        sorted.sort((a, b) =>
          stripPunctuation(b.name).localeCompare(stripPunctuation(a.name)),
        );
        break;
      case "rating":
        sorted.sort((a, b) => b.bgg_rating - a.bgg_rating);
        break;
      case "players-asc":
        sorted.sort((a, b) => a.min_players - b.min_players);
        break;
      case "players-desc":
        sorted.sort((a, b) => b.max_players - a.max_players);
        break;
      case "time-asc":
        sorted.sort((a, b) => a.playing_time - b.playing_time);
        break;
      case "time-desc":
        sorted.sort((a, b) => b.playing_time - a.playing_time);
        break;
    }

    return sorted;
  }, [games, search, filter, location, sort, effectiveMin, effectiveMax, playerBounds, timePreset, minRating]);

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

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort);
  const isPlayerRangeAll = effectiveMin <= playerBounds.min && effectiveMax >= playerBounds.max;
  const playerMaxLabel = effectiveMax >= 12 ? "12+" : String(effectiveMax);
  const playerRangeLabel = isPlayerRangeAll ? "Todo" : `${effectiveMin} – ${playerMaxLabel}`;

  const filtersToggleLabel =
    activeFilterCount > 0 ? `Filtros (${activeFilterCount})` : "Filtros y ordenación";

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <h1>Catálogo de juegos</h1>

        <div className="catalog-controls">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        <button
          className="catalog-filters-toggle"
          onClick={() => setFiltersOpen((prev) => !prev)}
          aria-expanded={filtersOpen}
        >
          <span className="catalog-filters-toggle-icon" aria-hidden="true">{filtersOpen ? "▲" : "▼"}</span>
          {filtersToggleLabel}
          {activeFilterCount > 0 && (
            <span className="catalog-filters-badge">{activeFilterCount}</span>
          )}
        </button>

        <div className={`catalog-filters-panel${filtersOpen ? " open" : ""}`}>
          <div className="catalog-filters-panel-inner">
            <div className="catalog-sort-wrapper" ref={sortRef}>
              <button
                className="catalog-sort-btn"
                onClick={() => setSortOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={sortOpen}
              >
                <span className="catalog-sort-icon" aria-hidden="true">⇅</span>
                {currentSortLabel ? currentSortLabel.label : "Ordenar"}
              </button>
              {sortOpen && (
                <div className="catalog-sort-panel" role="listbox" aria-label="Ordenar">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      role="option"
                      className={`catalog-sort-option${sort === option.value ? " selected" : ""}`}
                      aria-selected={sort === option.value}
                      onClick={() => handleSortSelect(option.value)}
                    >
                      <span className="catalog-sort-radio" aria-hidden="true">
                        {sort === option.value ? "●" : "○"}
                      </span>
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="catalog-filters">
              <FilterControl value={filter} onChange={setFilter} />
              <div className="filter-control" role="group" aria-label="Ubicación">
                {LOCATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={location === option.value ? "active" : ""}
                    onClick={() => setLocation(option.value)}
                    aria-pressed={location === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="catalog-filters-row3">
              {hasPlayerData && (
                <div className="catalog-filter-group">
                  <label className="catalog-filter-label">
                    Jugadores: {playerRangeLabel}
                  </label>
                  <div className="catalog-dual-slider">
                    <input
                      type="range"
                      className="catalog-dual-slider-input catalog-dual-slider-min"
                      min={playerBounds.min}
                      max={playerBounds.max}
                      step={1}
                      value={effectiveMin}
                      onChange={handlePlayersMinChange}
                      aria-label="Mínimo"
                    />
                    <input
                      type="range"
                      className="catalog-dual-slider-input catalog-dual-slider-max"
                      min={playerBounds.min}
                      max={playerBounds.max}
                      step={1}
                      value={effectiveMax}
                      onChange={handlePlayersMaxChange}
                      aria-label="Máximo"
                    />
                    <div className="catalog-dual-slider-track">
                      <div
                        className="catalog-dual-slider-range"
                        style={{
                          left: `${((effectiveMin - playerBounds.min) / (playerBounds.max - playerBounds.min)) * 100}%`,
                          right: `${100 - ((effectiveMax - playerBounds.min) / (playerBounds.max - playerBounds.min)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {hasTimeData && (
                <div className="catalog-filter-group">
                  <label className="catalog-filter-label">Tiempo de juego</label>
                  <div className="filter-control" role="group" aria-label="Tiempo de juego">
                    {TIME_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        className={timePreset === preset.value ? "active" : ""}
                        onClick={() => setTimePreset(preset.value)}
                        aria-pressed={timePreset === preset.value}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="catalog-filter-group">
                <label className="catalog-filter-label" htmlFor="min-rating-input">
                  Valoración mínima: {minRating.toFixed(1)}
                </label>
                <input
                  id="min-rating-input"
                  type="range"
                  className="catalog-rating-slider"
                  min={0}
                  max={10}
                  step={0.1}
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {filteredGames.length === 0 ? (
        <p className="catalog-empty">No se han encontrado juegos.</p>
      ) : (
        <div className="catalog-grid">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
