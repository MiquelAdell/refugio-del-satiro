import { stripPunctuation } from "./catalog";

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
  readonly categories: readonly string[];
  readonly publication_types: readonly string[];
  readonly status: RpgLendingStatus;
  readonly loan_id: number | null;
  readonly borrower_display_name: string | null;
}

export const rpgSortValues = ["name-asc", "name-desc", "rating"] as const;
export type RpgSortValue = (typeof rpgSortValues)[number];

export interface RpgQuery {
  readonly search: string;
  readonly sort: RpgSortValue;
}

export const DEFAULT_RPG_QUERY: RpgQuery = {
  search: "",
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
      (item) => search === "" || item.name.toLowerCase().includes(search),
    )
    .toSorted(RPG_COMPARATORS[query.sort]);
}
