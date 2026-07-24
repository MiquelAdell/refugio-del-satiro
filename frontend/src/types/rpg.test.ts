import { describe, expect, it } from "vitest";
import { applyRpgQuery, DEFAULT_RPG_QUERY, type RpgItem } from "./rpg";

const items: readonly RpgItem[] = [
  {
    id: 1,
    bgg_id: 101,
    name: "Urban Shadows",
    slug: "urban-shadows",
    thumbnail_url: "",
    image_url: "",
    year_published: 2015,
    bgg_rating: 8,
    description: "",
    description_es: "",
    categories: ["Fantasy (Modern Urban Fantasy)"],
    publication_types: ["Core Rules (min needed to play)"],
    status: "available",
    loan_id: null,
    borrower_display_name: null,
  },
  {
    id: 2,
    bgg_id: 102,
    name: "Call of Cthulhu Scenario",
    slug: "call-of-cthulhu-scenario",
    thumbnail_url: "",
    image_url: "",
    year_published: 1981,
    bgg_rating: 7.5,
    description: "",
    description_es: "",
    categories: ["Horror (Cthulhu Mythos)"],
    publication_types: ["Scenario / Adventure / Module"],
    status: "lent",
    loan_id: 7,
    borrower_display_name: "Ada",
  },
  {
    id: 3,
    bgg_id: 103,
    name: "Fantasy Campaign",
    slug: "fantasy-campaign",
    thumbnail_url: "",
    image_url: "",
    year_published: 2000,
    bgg_rating: 7,
    description: "",
    description_es: "",
    categories: ["Fantasy (High Fantasy)"],
    publication_types: [
      "Core Rules (min needed to play)",
      "Scenario / Adventure / Module",
    ],
    status: "available",
    loan_id: null,
    borrower_display_name: null,
  },
  {
    id: 4,
    bgg_id: 104,
    name: "Espionage Toolkit",
    slug: "espionage-toolkit",
    thumbnail_url: "",
    image_url: "",
    year_published: 1990,
    bgg_rating: 6.5,
    description: "",
    description_es: "",
    categories: ["Espionage"],
    publication_types: ["Accessory (dice, maps, screens, cards)"],
    status: "available",
    loan_id: null,
    borrower_display_name: null,
  },
  {
    id: 5,
    bgg_id: 105,
    name: "Uncategorised Book",
    slug: "uncategorised-book",
    thumbnail_url: "",
    image_url: "",
    year_published: 1995,
    bgg_rating: 8.5,
    description: "",
    description_es: "",
    categories: [],
    publication_types: [],
    status: "available",
    loan_id: null,
    borrower_display_name: null,
  },
];

const ids = (filtered: readonly RpgItem[]) => filtered.map((item) => item.id);

describe("applyRpgQuery", () => {
  it("filters by a single genre without letting urban fantasy leak into fantasy", () => {
    expect(
      ids(applyRpgQuery(items, { ...DEFAULT_RPG_QUERY, genre: "horror" })),
    ).toEqual([2]);
    expect(
      ids(applyRpgQuery(items, { ...DEFAULT_RPG_QUERY, genre: "fantasy" })),
    ).toEqual([3]);
  });

  it("puts empty and unmapped categories in Otros, but excludes mixed categories", () => {
    const mixed: RpgItem = {
      ...items[3],
      id: 6,
      name: "Mixed categories",
      categories: ["Espionage", "Horror"],
    };

    expect(
      ids(
        applyRpgQuery([...items, mixed], {
          ...DEFAULT_RPG_QUERY,
          genre: "other",
        }),
      ),
    ).toEqual([4, 5]);
  });

  it("filters publication types, including an item that belongs to both kinds", () => {
    expect(
      ids(
        applyRpgQuery(items, {
          ...DEFAULT_RPG_QUERY,
          publicationKind: "rulebook",
        }),
      ),
    ).toEqual([3, 1]);
    expect(
      ids(
        applyRpgQuery(items, {
          ...DEFAULT_RPG_QUERY,
          publicationKind: "adventure",
        }),
      ),
    ).toEqual([2, 3]);
  });

  it("filters availability and includes the minimum rating boundary", () => {
    expect(
      ids(applyRpgQuery(items, { ...DEFAULT_RPG_QUERY, availability: "lent" })),
    ).toEqual([2]);
    expect(
      ids(applyRpgQuery(items, { ...DEFAULT_RPG_QUERY, minRating: 7.5 })),
    ).toEqual([2, 5, 1]);
  });

  it("returns no items when combined filters do not overlap", () => {
    expect(
      applyRpgQuery(items, {
        ...DEFAULT_RPG_QUERY,
        genre: "horror",
        publicationKind: "rulebook",
        availability: "available",
        minRating: 9,
      }),
    ).toEqual([]);
  });

  it("returns every item under the default query", () => {
    expect(ids(applyRpgQuery(items, DEFAULT_RPG_QUERY))).toEqual([
      2, 4, 3, 5, 1,
    ]);
  });
});
