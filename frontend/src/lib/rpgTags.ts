/*
 * Pure helpers for the RPG book card's meta icons and category tag pill.
 *
 * RPGGeek items carry no `primary_tag`, so the pill always comes from the
 * item's own most-common category (same frequency ranking as the board game
 * catalog, see gameTags.ts). Known category families map to Spanish labels
 * and pastel colours (style-guide §2.3: "Mitología", "Horror",
 * "Ciencia Ficción"); unknown ones fall back to the raw RPGGeek name.
 */

import type { TagPill } from "./gameTags";

export type RpgGenreFamilyKey =
  | "fantasy"
  | "urban-fantasy"
  | "horror"
  | "sci-fi"
  | "mythology"
  | "history"
  | "adventure"
  | "modern";

/** Prefix-matched, so "Horror (Cthulhu Mythos)" resolves to "Horror". */
const RPG_CATEGORY_PILLS: readonly (readonly [
  RpgGenreFamilyKey,
  string,
  TagPill,
])[] = [
  [
    "urban-fantasy",
    "Fantasy (Modern Urban Fantasy)",
    { label: "Fantasía Urbana", colorClass: "game-card-tag--turquoise" },
  ],
  [
    "fantasy",
    "Fantasy",
    { label: "Fantasía", colorClass: "game-card-tag--mint" },
  ],
  ["horror", "Horror", { label: "Horror", colorClass: "game-card-tag--pink" }],
  [
    "sci-fi",
    "Science Fiction",
    { label: "Ciencia Ficción", colorClass: "game-card-tag--lavender" },
  ],
  [
    "mythology",
    "Mythology / Folklore",
    { label: "Mitología", colorClass: "game-card-tag--sky" },
  ],
  [
    "history",
    "History",
    { label: "Histórico", colorClass: "game-card-tag--peach" },
  ],
  [
    "adventure",
    "Action / Adventure",
    { label: "Aventura", colorClass: "game-card-tag--yellow" },
  ],
  [
    "modern",
    "Modern",
    { label: "Moderno", colorClass: "game-card-tag--pearl" },
  ],
];

export const RPG_GENRE_FAMILIES: readonly {
  readonly key: RpgGenreFamilyKey;
  readonly label: string;
}[] = RPG_CATEGORY_PILLS.map(([key, , pill]) => ({ key, label: pill.label }));

/** Neutral pastel used when the category has no Spanish mapping. */
const FALLBACK_CATEGORY_COLOR_CLASS = "game-card-tag--pearl";

export function resolveRpgTagPill(
  category: string | undefined,
): TagPill | undefined {
  if (!category) {
    return undefined;
  }
  const family = RPG_CATEGORY_PILLS.find(([, prefix]) =>
    category.startsWith(prefix),
  );
  return (
    family?.[2] ?? {
      label: category,
      colorClass: FALLBACK_CATEGORY_COLOR_CLASS,
    }
  );
}

function resolveRpgGenreFamily(
  category: string,
): RpgGenreFamilyKey | undefined {
  return RPG_CATEGORY_PILLS.find(([, prefix]) =>
    category.startsWith(prefix),
  )?.[0];
}

export function matchesRpgGenre(
  categories: readonly string[],
  genreKey: RpgGenreFamilyKey | "other",
): boolean {
  const resolvedFamilies = categories.flatMap((category) => {
    const family = resolveRpgGenreFamily(category);
    return family === undefined ? [] : [family];
  });

  return genreKey === "other"
    ? resolvedFamilies.length === 0
    : resolvedFamilies.includes(genreKey);
}

/*
 * RPGGeek publication types map to the two meta icons of style-guide §5.6:
 * book = rulebook-style content, quill = adventure/module content. Types
 * outside both groups (accessories, non-game books) show no icon.
 */

const RULEBOOK_TYPE_PREFIXES = [
  "Core Rules",
  "Sourcebook",
  "Campaign Setting",
  "Quick Start",
] as const;

const ADVENTURE_TYPE_PREFIX = "Scenario";

export interface RpgPublicationKinds {
  readonly rulebook: boolean;
  readonly adventure: boolean;
}

export function rpgPublicationKinds(
  publicationTypes: readonly string[],
): RpgPublicationKinds {
  return {
    rulebook: publicationTypes.some((type) =>
      RULEBOOK_TYPE_PREFIXES.some((prefix) => type.startsWith(prefix)),
    ),
    adventure: publicationTypes.some((type) =>
      type.startsWith(ADVENTURE_TYPE_PREFIX),
    ),
  };
}

export function matchesPublicationKind(
  publicationTypes: readonly string[],
  kind: keyof RpgPublicationKinds,
): boolean {
  return rpgPublicationKinds(publicationTypes)[kind];
}
