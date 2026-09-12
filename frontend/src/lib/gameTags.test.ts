import { describe, expect, it } from "vitest";
import {
  computeCategoryFrequency,
  mostCommonOwnCategory,
  resolveTagPill,
} from "./gameTags";

describe("resolveTagPill", () => {
  it("maps a known primary_tag to its Spanish label and pill colour", () => {
    expect(resolveTagPill("thematic", undefined)).toEqual({
      label: "Temático",
      colorClass: "game-card-tag--sky",
    });
  });

  it("falls back to the raw category with a neutral colour when primary_tag is unknown", () => {
    expect(resolveTagPill("", "Economic")).toEqual({
      label: "Economic",
      colorClass: "game-card-tag--pearl",
    });
  });

  it("returns undefined when there is neither a primary_tag nor a fallback category", () => {
    expect(resolveTagPill("", undefined)).toBeUndefined();
  });
});

describe("computeCategoryFrequency", () => {
  it("counts occurrences of each category across all games", () => {
    const games = [
      { categories: ["Economic", "Negotiation"] },
      { categories: ["Economic"] },
      { categories: ["Fantasy"] },
    ];

    expect(computeCategoryFrequency(games)).toEqual({
      Economic: 2,
      Negotiation: 1,
      Fantasy: 1,
    });
  });

  it("returns an empty object for an empty game list", () => {
    expect(computeCategoryFrequency([])).toEqual({});
  });
});

describe("mostCommonOwnCategory", () => {
  it("picks the game's own category with the highest catalog-wide frequency", () => {
    const frequency = { Economic: 2, Negotiation: 1 };

    expect(mostCommonOwnCategory(["Negotiation", "Economic"], frequency)).toBe(
      "Economic",
    );
  });

  it("returns undefined when the game has no categories", () => {
    expect(mostCommonOwnCategory([], {})).toBeUndefined();
  });
});
