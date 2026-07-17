/*
 * Pure helpers for the catalog card's category tag pill.
 *
 * `primary_tag` on a game is a raw BGG subdomain name. We map it to a
 * Spanish label and a pastel colour token (see frontend/src/tokens.css
 * `--pill-*`). When a game has no `primary_tag`, the catalog falls back to
 * that game's own most-common BGG category, ranked by frequency across the
 * whole loaded catalog.
 */

export const PRIMARY_TAG_KEYS = [
  "familygames",
  "strategygames",
  "partygames",
  "thematic",
  "abstracts",
  "childrensgames",
  "wargames",
  "cgs",
] as const;

export type PrimaryTagKey = (typeof PRIMARY_TAG_KEYS)[number];

export interface TagPill {
  readonly label: string;
  /** BEM-style modifier class applied alongside `game-card-tag` (see GameCard.css). */
  readonly colorClass: string;
}

const PRIMARY_TAG_PILLS: Record<PrimaryTagKey, TagPill> = {
  familygames: { label: "Familiar", colorClass: "game-card-tag--mint" },
  strategygames: { label: "Estrategia", colorClass: "game-card-tag--pearl" },
  partygames: { label: "Fiesta", colorClass: "game-card-tag--pink" },
  thematic: { label: "Temático", colorClass: "game-card-tag--sky" },
  abstracts: { label: "Abstracto", colorClass: "game-card-tag--lavender" },
  childrensgames: { label: "Infantil", colorClass: "game-card-tag--yellow" },
  wargames: { label: "Bélico", colorClass: "game-card-tag--peach" },
  cgs: { label: "Cartas", colorClass: "game-card-tag--turquoise" },
};

/** Neutral pastel used when we fall back to a raw, untranslated BGG category. */
const FALLBACK_CATEGORY_COLOR_CLASS = "game-card-tag--pearl";

function isPrimaryTagKey(value: string): value is PrimaryTagKey {
  return (PRIMARY_TAG_KEYS as readonly string[]).includes(value);
}

/**
 * Resolves the pill to render for a game: the mapped `primary_tag` label
 * when available, otherwise the (untranslated) fallback category, otherwise
 * no pill at all.
 */
export function resolveTagPill(
  primaryTag: string,
  fallbackCategory: string | undefined,
): TagPill | undefined {
  if (isPrimaryTagKey(primaryTag)) {
    return PRIMARY_TAG_PILLS[primaryTag];
  }
  if (fallbackCategory) {
    return { label: fallbackCategory, colorClass: FALLBACK_CATEGORY_COLOR_CLASS };
  }
  return undefined;
}

/** Counts how many times each BGG category appears across a list of games. */
export function computeCategoryFrequency(
  games: readonly { readonly categories: readonly string[] }[],
): Readonly<Record<string, number>> {
  return games
    .flatMap((game) => game.categories)
    .reduce<Record<string, number>>(
      (frequency, category) => ({
        ...frequency,
        [category]: (frequency[category] ?? 0) + 1,
      }),
      {},
    );
}

/**
 * Picks the game's own category that is most frequent across the whole
 * catalog (per the given frequency map). Returns undefined when the game
 * has no categories.
 */
export function mostCommonOwnCategory(
  categories: readonly string[],
  frequency: Readonly<Record<string, number>>,
): string | undefined {
  return categories.toSorted(
    (a, b) => (frequency[b] ?? 0) - (frequency[a] ?? 0),
  )[0];
}
