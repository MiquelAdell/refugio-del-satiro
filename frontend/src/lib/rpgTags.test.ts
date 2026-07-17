import { describe, expect, it } from "vitest";
import { resolveRpgTagPill, rpgPublicationKinds } from "./rpgTags";

const CORE_RULES_TYPE = "Core Rules (min needed to play)";
const SOURCEBOOK_TYPE = "Sourcebook (rules/options to enhance play)";
const ADVENTURE_TYPE = "Scenario / Adventure / Module";
const ACCESSORY_TYPE = "Accessory (dice, maps, screens, cards)";

describe("resolveRpgTagPill", () => {
  it("returns undefined without a category", () => {
    expect(resolveRpgTagPill(undefined)).toBeUndefined();
    expect(resolveRpgTagPill("")).toBeUndefined();
  });

  it("maps category families to Spanish pills by prefix", () => {
    expect(resolveRpgTagPill("Horror (Cthulhu Mythos)")).toEqual({
      label: "Horror",
      colorClass: "game-card-tag--pink",
    });
    expect(resolveRpgTagPill("Science Fiction (Space Opera)")).toEqual({
      label: "Ciencia Ficción",
      colorClass: "game-card-tag--lavender",
    });
    expect(resolveRpgTagPill("Mythology / Folklore")).toEqual({
      label: "Mitología",
      colorClass: "game-card-tag--sky",
    });
  });

  it("prefers the more specific urban fantasy family over plain fantasy", () => {
    expect(resolveRpgTagPill("Fantasy (Modern Urban Fantasy)")).toEqual({
      label: "Fantasía Urbana",
      colorClass: "game-card-tag--turquoise",
    });
    expect(resolveRpgTagPill("Fantasy (High Fantasy)")).toEqual({
      label: "Fantasía",
      colorClass: "game-card-tag--mint",
    });
  });

  it("falls back to the raw category with the neutral colour", () => {
    expect(resolveRpgTagPill("Espionage")).toEqual({
      label: "Espionage",
      colorClass: "game-card-tag--pearl",
    });
  });
});

describe("rpgPublicationKinds", () => {
  it("flags rulebook-style types", () => {
    expect(rpgPublicationKinds([CORE_RULES_TYPE])).toEqual({
      rulebook: true,
      adventure: false,
    });
    expect(rpgPublicationKinds([SOURCEBOOK_TYPE])).toEqual({
      rulebook: true,
      adventure: false,
    });
  });

  it("flags adventure types", () => {
    expect(rpgPublicationKinds([ADVENTURE_TYPE])).toEqual({
      rulebook: false,
      adventure: true,
    });
  });

  it("flags both for mixed publications", () => {
    expect(rpgPublicationKinds([CORE_RULES_TYPE, ADVENTURE_TYPE])).toEqual({
      rulebook: true,
      adventure: true,
    });
  });

  it("flags neither for accessories or empty lists", () => {
    expect(rpgPublicationKinds([ACCESSORY_TYPE])).toEqual({
      rulebook: false,
      adventure: false,
    });
    expect(rpgPublicationKinds([])).toEqual({
      rulebook: false,
      adventure: false,
    });
  });
});
