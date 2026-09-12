import { describe, expect, it } from "vitest";
import {
  applyCatalogQuery,
  DEFAULT_CATALOG_QUERY,
  LOCATION_OPTIONS,
} from "./catalog";
import type { GameWithStatus } from "./game";

const ARMARIO_GAME: GameWithStatus = {
  id: 1,
  bgg_id: 101,
  name: "Armario game",
  slug: "armario-game",
  thumbnail_url: "",
  image_url: "",
  year_published: 2020,
  min_players: 2,
  max_players: 4,
  playing_time: 60,
  min_age: 10,
  bgg_rating: 7,
  location: "armario",
  description: "",
  description_es: "",
  categories: [],
  primary_tag: "",
  status: "available",
  borrower_display_name: null,
  loan_id: null,
};

const SOTANO_GAME: GameWithStatus = {
  ...ARMARIO_GAME,
  id: 2,
  bgg_id: 102,
  name: "Sótano game",
  slug: "sotano-game",
  location: "sotano",
};

const YOUNGER_GAME: GameWithStatus = {
  ...ARMARIO_GAME,
  id: 3,
  bgg_id: 103,
  name: "Younger game",
  slug: "younger-game",
  min_age: 8,
};

const UNKNOWN_AGE_GAME: GameWithStatus = {
  ...ARMARIO_GAME,
  id: 4,
  bgg_id: 104,
  name: "Unknown age game",
  slug: "unknown-age-game",
  min_age: 0,
};

const GAMES = [ARMARIO_GAME, SOTANO_GAME] as const;

describe("catalog location filtering", () => {
  it("keeps the persisted location values and Spanish labels", () => {
    expect(LOCATION_OPTIONS).toEqual([
      { value: "all", label: "Todos" },
      { value: "armario", label: "Armario" },
      { value: "sotano", label: "Sótano" },
    ]);
  });

  it.each([
    ["Todos", "all", ["Armario game", "Sótano game"]],
    ["Armario", "armario", ["Armario game"]],
    ["Sótano", "sotano", ["Sótano game"]],
  ] as const)(
    "returns the expected games for %s",
    (_label, location, names) => {
      const games = applyCatalogQuery(GAMES, {
        ...DEFAULT_CATALOG_QUERY,
        location,
      });

      expect(games.map(({ name }) => name)).toEqual(names);
    },
  );
});

describe("catalog player-age filtering", () => {
  it("includes known minimum ages up to the selected player age", () => {
    const games = applyCatalogQuery(
      [ARMARIO_GAME, YOUNGER_GAME, UNKNOWN_AGE_GAME],
      { ...DEFAULT_CATALOG_QUERY, playerAge: 8 },
    );

    expect(games.map(({ name }) => name)).toEqual(["Younger game"]);
  });

  it("includes a game whose minimum age equals the selected boundary", () => {
    const games = applyCatalogQuery([ARMARIO_GAME], {
      ...DEFAULT_CATALOG_QUERY,
      playerAge: 10,
    });

    expect(games.map(({ name }) => name)).toEqual(["Armario game"]);
  });

  it("does not filter unknown ages when no player age is selected", () => {
    const games = applyCatalogQuery([UNKNOWN_AGE_GAME], DEFAULT_CATALOG_QUERY);

    expect(games.map(({ name }) => name)).toEqual(["Unknown age game"]);
  });
});
