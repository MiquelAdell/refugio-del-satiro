import { type AvailabilityValue, stripPunctuation } from "./catalog";
import {
  matchesPublicationKind,
  matchesRpgGenre,
  RPG_GENRE_FAMILIES,
} from "../lib/rpgTags";

export const rpgLendingStatuses = ["available", "lent"] as const;
export type RpgLendingStatus = (typeof rpgLendingStatuses)[number];

export interface RpgItem {
  readonly id: number;
  readonly bgg_id: number;
  readonly name: string;
  readonly slug: string;
  readonly thumbnail_url: string;
  readonly image_url: string;
  readonly year_published: number;
  readonly bgg_rating: number;
  readonly description: string;
  readonly description_es: string;
  readonly categories: readonly string[];
  readonly publication_types: readonly string[];
  readonly status: RpgLendingStatus;
  readonly loan_id: number | null;
  readonly borrower_display_name: string | null;
}

export const rpgSortValues = ["name-asc", "name-desc", "rating"] as const;
export type RpgSortValue = (typeof rpgSortValues)[number];

export const rpgGenreValues = [
  "all",
  "fantasy",
  "urban-fantasy",
  "horror",
  "sci-fi",
  "mythology",
  "history",
  "adventure",
  "modern",
  "other",
] as const;
export type RpgGenreValue = (typeof rpgGenreValues)[number];

export const rpgPublicationValues = ["all", "rulebook", "adventure"] as const;
export type RpgPublicationValue = (typeof rpgPublicationValues)[number];

export interface RpgQuery {
  readonly search: string;
  readonly genre: RpgGenreValue;
  readonly publicationKind: RpgPublicationValue;
  readonly availability: AvailabilityValue;
  readonly minRating: number;
  readonly sort: RpgSortValue;
}

export const DEFAULT_RPG_QUERY: RpgQuery = {
  search: "",
  genre: "all",
  publicationKind: "all",
  availability: "all",
  minRating: 0,
  sort: "name-asc",
};

export interface RpgSortOption {
  readonly value: RpgSortValue;
  readonly label: string;
}

export const RPG_SORT_OPTIONS: readonly RpgSortOption[] = [
  { value: "name-asc", label: "Nombre (A-Z)" },
  { value: "name-desc", label: "Nombre (Z-A)" },
  { value: "rating", label: "Valoración BGG (alta a baja)" },
];

export const RPG_GENRE_OPTIONS: readonly {
  readonly value: RpgGenreValue;
  readonly label: string;
}[] = [
  { value: "all", label: "Todos" },
  ...RPG_GENRE_FAMILIES.map(({ key, label }) => ({ value: key, label })),
  { value: "other", label: "Otros" },
];

export const RPG_PUBLICATION_OPTIONS: readonly {
  readonly value: RpgPublicationValue;
  readonly label: string;
}[] = [
  { value: "all", label: "Todos" },
  { value: "rulebook", label: "Manual" },
  { value: "adventure", label: "Aventura" },
];

const RPG_COMPARATORS: Record<
  RpgSortValue,
  (a: RpgItem, b: RpgItem) => number
> = {
  "name-asc": (a, b) =>
    stripPunctuation(a.name).localeCompare(stripPunctuation(b.name)),
  "name-desc": (a, b) =>
    stripPunctuation(b.name).localeCompare(stripPunctuation(a.name)),
  rating: (a, b) => b.bgg_rating - a.bgg_rating,
};

export function applyRpgQuery(
  items: readonly RpgItem[],
  query: RpgQuery,
): readonly RpgItem[] {
  const search = query.search.trim().toLowerCase();

  return items
    .filter(
      (item) =>
        query.availability === "all" || item.status === query.availability,
    )
    .filter(
      (item) =>
        query.genre === "all" || matchesRpgGenre(item.categories, query.genre),
    )
    .filter(
      (item) =>
        query.publicationKind === "all" ||
        matchesPublicationKind(item.publication_types, query.publicationKind),
    )
    .filter((item) => search === "" || item.name.toLowerCase().includes(search))
    .filter(
      (item) => query.minRating <= 0 || item.bgg_rating >= query.minRating,
    )
    .toSorted(RPG_COMPARATORS[query.sort]);
}
