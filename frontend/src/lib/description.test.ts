import { describe, expect, it } from "vitest";
import { displayDescription } from "./description";

const ENGLISH = "Trade and build across the island.";
const SPANISH = "Comercia y construye por la isla.";

describe("displayDescription", () => {
  it("prefers the Spanish translation when present", () => {
    expect(
      displayDescription({ description: ENGLISH, description_es: SPANISH }),
    ).toBe(SPANISH);
  });

  it("falls back to the English source when no translation exists", () => {
    expect(
      displayDescription({ description: ENGLISH, description_es: "" }),
    ).toBe(ENGLISH);
  });

  it("returns an empty string when both are empty", () => {
    expect(displayDescription({ description: "", description_es: "" })).toBe("");
  });
});
