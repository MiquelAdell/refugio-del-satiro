import type { GameWithStatus } from "./game";

export const availabilityValues = ["all", "available", "lent"] as const;
export type AvailabilityValue = (typeof availabilityValues)[number];

export const locationValues = ["all", "armari", "soterrani"] as const;
export type LocationValue = (typeof locationValues)[number];

export const timePresets = ["all", "lt30", "30to60", "1to2h", "2hplus"] as const;
export type TimePreset = (typeof timePresets)[number];

export const sortValues = [
  "name-asc",
  "name-desc",
  "rating",
  "players-asc",
  "players-desc",
  "time-asc",
  "time-desc",
] as const;
export type SortValue = (typeof sortValues)[number];

export const catalogViews = ["grid", "list"] as const;
export type CatalogView = (typeof catalogViews)[number];

export interface CatalogQuery {
  readonly search: string;
  readonly availability: AvailabilityValue;
  readonly location: LocationValue;
  readonly timePreset: TimePreset;
  readonly minRating: number;
  readonly playersMin: number;
  readonly playersMax: number;
  readonly sort: SortValue;
}

export const PLAYER_BOUNDS = { min: 1, max: 12 } as const;

interface LabelledOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export const SORT_OPTIONS: readonly LabelledOption<SortValue>[] = [
  { value: "name-asc", label: "Nombre (A-Z)" },
  { value: "name-desc", label: "Nombre (Z-A)" },
  { value: "rating", label: "Valoración BGG (alta a baja)" },
  { value: "players-asc", label: "Jugadores (menos a más)" },
  { value: "players-desc", label: "Jugadores (más a menos)" },
  { value: "time-asc", label: "Tiempo de juego (corto a largo)" },
  { value: "time-desc", label: "Tiempo de juego (largo a corto)" },
];

export const AVAILABILITY_OPTIONS: readonly LabelledOption<AvailabilityValue>[] = [
  { value: "all", label: "Todos" },
  { value: "available", label: "Disponible" },
  { value: "lent", label: "Prestado" },
];

export const LOCATION_OPTIONS: readonly LabelledOption<LocationValue>[] = [
  { value: "all", label: "Todos" },
  { value: "armari", label: "Armario" },
  { value: "soterrani", label: "Sótano" },
];

export const TIME_PRESET_OPTIONS: readonly LabelledOption<TimePreset>[] = [
  { value: "all", label: "Todo" },
  { value: "lt30", label: "< 30 min" },
  { value: "30to60", label: "30-60 min" },
  { value: "1to2h", label: "1-2h" },
  { value: "2hplus", label: "2h+" },
];

export const DEFAULT_CATALOG_QUERY: CatalogQuery = {
  search: "",
  availability: "all",
  location: "all",
  timePreset: "all",
  minRating: 0,
  playersMin: PLAYER_BOUNDS.min,
  playersMax: PLAYER_BOUNDS.max,
  sort: "name-asc",
};

export function stripPunctuation(name: string): string {
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

function matchesPlayerRange(
  game: GameWithStatus,
  pMin: number,
  pMax: number,
): boolean {
  if (game.min_players <= 0 && game.max_players <= 0) return false;
  const effectivePMax = pMax >= PLAYER_BOUNDS.max ? Infinity : pMax;
  if (game.min_players > effectivePMax) return false;
  if (game.max_players > 0 && game.max_players < pMin) return false;
  return true;
}

const COMPARATORS: Record<
  SortValue,
  (a: GameWithStatus, b: GameWithStatus) => number
> = {
  "name-asc": (a, b) =>
    stripPunctuation(a.name).localeCompare(stripPunctuation(b.name)),
  "name-desc": (a, b) =>
    stripPunctuation(b.name).localeCompare(stripPunctuation(a.name)),
  rating: (a, b) => b.bgg_rating - a.bgg_rating,
  "players-asc": (a, b) => a.min_players - b.min_players,
  "players-desc": (a, b) => b.max_players - a.max_players,
  "time-asc": (a, b) => a.playing_time - b.playing_time,
  "time-desc": (a, b) => b.playing_time - a.playing_time,
};

export function applyCatalogQuery(
  games: readonly GameWithStatus[],
  query: CatalogQuery,
): readonly GameWithStatus[] {
  const search = query.search.trim().toLowerCase();
  const playerRangeActive =
    query.playersMin > PLAYER_BOUNDS.min || query.playersMax < PLAYER_BOUNDS.max;

  return games
    .filter((g) => query.availability === "all" || g.status === query.availability)
    .filter((g) => query.location === "all" || g.location === query.location)
    .filter((g) => search === "" || g.name.toLowerCase().includes(search))
    .filter(
      (g) =>
        !playerRangeActive ||
        matchesPlayerRange(g, query.playersMin, query.playersMax),
    )
    .filter((g) => matchesTimePreset(g.playing_time, query.timePreset))
    .filter((g) => query.minRating <= 0 || g.bgg_rating >= query.minRating)
    .toSorted(COMPARATORS[query.sort]);
}
