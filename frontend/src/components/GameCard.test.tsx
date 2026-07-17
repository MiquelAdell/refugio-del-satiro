import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { GameCard } from "./GameCard";
import type { CatalogView } from "../types/catalog";
import type { GameWithStatus } from "../types/game";

const RATING_CLASS = "game-card-rating";
const RIBBON_CLASS = "game-card-ribbon";
const RIBBON_LENT_CLASS = "game-card-ribbon-lent";
const DESCRIPTION_CLASS = "game-card-description";
const TAG_CLASS = "game-card-tag";

const baseGame: GameWithStatus = {
  id: 1,
  bgg_id: 100,
  name: "Catan",
  slug: "catan",
  thumbnail_url: "https://example.com/catan.jpg",
  image_url: "https://example.com/catan-large.jpg",
  year_published: 1995,
  min_players: 3,
  max_players: 4,
  playing_time: 90,
  min_age: 10,
  bgg_rating: 7.2,
  location: "armario",
  description: "Trade and build across the island.",
  description_es: "",
  categories: [],
  primary_tag: "familygames",
  status: "available",
  borrower_display_name: null,
  loan_id: null,
};

function buildGame(overrides: Partial<GameWithStatus> = {}): GameWithStatus {
  return { ...baseGame, ...overrides };
}

function renderCard(
  overrides: Partial<GameWithStatus> = {},
  view: CatalogView = "grid",
  fallbackCategory?: string,
) {
  return render(
    <MemoryRouter>
      <GameCard
        game={buildGame(overrides)}
        view={view}
        fallbackCategory={fallbackCategory}
      />
    </MemoryRouter>,
  );
}

describe("GameCard rating block (DQ-1)", () => {
  it("shows the BGG rating as a red square, one decimal", () => {
    const { container } = renderCard({ bgg_rating: 8.4 });

    const rating = screen.getByText("8.4");
    expect(rating.className).toBe(RATING_CLASS);
    expect(container.querySelector(`.${RATING_CLASS}`)).toBe(rating);
  });

  it("omits the rating block when the game has no rating", () => {
    const { container } = renderCard({ bgg_rating: 0 });

    expect(container.querySelector(`.${RATING_CLASS}`)).toBeNull();
  });
});

describe("GameCard status ribbon", () => {
  it("renders the 'EN PRÉSTAMO' ribbon for a lent game", () => {
    const { container } = renderCard({ status: "lent" });

    const ribbon = screen.getByText("EN PRÉSTAMO");
    expect(ribbon.className).toBe(`${RIBBON_CLASS} ${RIBBON_LENT_CLASS}`);
    expect(container.querySelector(`.${RIBBON_CLASS}`)).toBe(ribbon);
  });

  it("renders no ribbon for an available game", () => {
    const { container } = renderCard({ status: "available" });

    expect(container.querySelector(`.${RIBBON_CLASS}`)).toBeNull();
  });

  it("never renders the borrower name", () => {
    renderCard({ status: "lent", borrower_display_name: "Alice", loan_id: 7 });

    expect(screen.queryByText(/Alice/)).toBeNull();
  });

  it("exposes title and availability to assistive tech via aria-label", () => {
    renderCard({ status: "lent", borrower_display_name: null, loan_id: 7 });

    expect(
      screen.getByRole("link", { name: "Catan — Prestado" }),
    ).toBeInTheDocument();
  });
});

describe("GameCard description excerpt", () => {
  it("renders the description with the line-clamp class", () => {
    const { container } = renderCard({ description: "A trading game." });

    const description = container.querySelector(`.${DESCRIPTION_CLASS}`);
    expect(description).toHaveTextContent("A trading game.");
  });

  it("prefers the Spanish translation when present", () => {
    const { container } = renderCard({
      description: "A trading game.",
      description_es: "Un juego de comercio.",
    });

    const description = container.querySelector(`.${DESCRIPTION_CLASS}`);
    expect(description).toHaveTextContent("Un juego de comercio.");
  });

  it("renders nothing when the game has no description", () => {
    const { container } = renderCard({ description: "", description_es: "" });

    expect(container.querySelector(`.${DESCRIPTION_CLASS}`)).toBeNull();
  });
});

describe("GameCard meta column", () => {
  it("renders age, playing time, and player range", () => {
    renderCard({ min_age: 8, playing_time: 30, min_players: 3, max_players: 8 });

    expect(screen.getByText("8+")).toBeInTheDocument();
    expect(screen.getByText("30min")).toBeInTheDocument();
    expect(screen.getByText("3-8")).toBeInTheDocument();
  });

  it("hides the age item when min_age is 0", () => {
    renderCard({ min_age: 0 });

    expect(screen.queryByText(/\+$/)).toBeNull();
  });

  it("hides the playing time item when it is 0", () => {
    renderCard({ playing_time: 0 });

    expect(screen.queryByText(/min$/)).toBeNull();
  });

  it("hides the player range when either bound is 0", () => {
    renderCard({ min_players: 0, max_players: 0 });

    expect(screen.queryByText(/^\d+-\d+$/)).toBeNull();
  });
});

describe("GameCard tag pill", () => {
  it("maps a known primary_tag to its Spanish label", () => {
    const { container } = renderCard({ primary_tag: "strategygames" });

    const tag = screen.getByText("Estrategia");
    expect(tag.className).toBe(`${TAG_CLASS} game-card-tag--pearl`);
    expect(container.querySelector(`.${TAG_CLASS}`)).toBe(tag);
  });

  it("maps every known primary_tag to its Spanish label", () => {
    const expectations: ReadonlyArray<[string, string]> = [
      ["familygames", "Familiar"],
      ["strategygames", "Estrategia"],
      ["partygames", "Fiesta"],
      ["thematic", "Temático"],
      ["abstracts", "Abstracto"],
      ["childrensgames", "Infantil"],
      ["wargames", "Bélico"],
      ["cgs", "Cartas"],
    ];

    expectations.forEach(([primaryTag, label]) => {
      const { unmount } = renderCard({ primary_tag: primaryTag });
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    });
  });

  it("falls back to the game's most common own category when primary_tag is empty", () => {
    renderCard(
      { primary_tag: "", categories: ["Economic"] },
      "grid",
      "Economic",
    );

    expect(screen.getByText("Economic")).toBeInTheDocument();
  });

  it("renders no pill when primary_tag is empty and there is no fallback category", () => {
    const { container } = renderCard({ primary_tag: "", categories: [] });

    expect(container.querySelector(`.${TAG_CLASS}`)).toBeNull();
  });
});

describe("GameCard view modes", () => {
  it("renders the grid variant by default", () => {
    const { container } = renderCard();

    expect(container.querySelector("article")?.className).toBe(
      "game-card game-card-grid",
    );
  });

  it("renders the list variant when view='list'", () => {
    const { container } = renderCard({}, "list");

    expect(container.querySelector("article")?.className).toBe(
      "game-card game-card-list",
    );
  });
});

describe("GameCard navigation", () => {
  it("links to the game detail page using the slug", () => {
    renderCard();

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/juegos/catan");
  });
});
