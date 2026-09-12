import { describe, expect, it } from "vitest";
import { getLoanDetailPath, isLoanAtLeastThirtyDaysOld } from "./activeLoan";

const NOW = new Date("2026-08-17T12:00:00Z");

describe("getLoanDetailPath", () => {
  it("routes board games to the board-game detail page", () => {
    expect(getLoanDetailPath("boardgame", "catan")).toEqual("/juegos/catan");
  });

  it("routes RPG items to the RPG detail page", () => {
    expect(getLoanDetailPath("rpgitem", "dungeons-dragons")).toEqual(
      "/rol/dungeons-dragons",
    );
  });
});

describe("isLoanAtLeastThirtyDaysOld", () => {
  it("does not mark a loan at 29 days and 23 hours 59 minutes", () => {
    expect(isLoanAtLeastThirtyDaysOld("2026-07-18T12:01:00Z", NOW)).toEqual(
      false,
    );
  });

  it("marks a loan at exactly 30 complete elapsed UTC days", () => {
    expect(isLoanAtLeastThirtyDaysOld("2026-07-18T12:00:00Z", NOW)).toEqual(
      true,
    );
  });

  it("marks a loan older than 30 days", () => {
    expect(isLoanAtLeastThirtyDaysOld("2026-06-01T08:30:00Z", NOW)).toEqual(
      true,
    );
  });

  it("does not mark an invalid timestamp", () => {
    expect(isLoanAtLeastThirtyDaysOld("not-a-date", NOW)).toEqual(false);
  });

  it("does not mark a future timestamp", () => {
    expect(isLoanAtLeastThirtyDaysOld("2026-08-18T12:00:00Z", NOW)).toEqual(
      false,
    );
  });
});
