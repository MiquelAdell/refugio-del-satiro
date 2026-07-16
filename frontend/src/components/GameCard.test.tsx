import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { GameCard } from "./GameCard";
import type { CatalogView } from "../types/catalog";
import type { GameWithStatus } from "../types/game";

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
  bgg_rating: 7.2,
  location: "armario",
  description: "",
  categories: [],
  status: "available",
  borrower_display_name: null,
  loan_id: null,
};

function renderCard(
  overrides: Partial<GameWithStatus> = {},
  view: CatalogView = "grid",
) {
  return render(
    <MemoryRouter>
      <GameCard game={{ ...baseGame, ...overrides }} view={view} />
    </MemoryRouter>,
  );
}

describe("GameCard availability badge", () => {
  it("renders 'Disponible' for an available game", () => {
    renderCard({ status: "available" });

    expect(screen.getByText("Disponible")).toBeInTheDocument();
  });

  it("renders the no-name 'Prestado' badge for a lent game", () => {
    renderCard({ status: "lent", borrower_display_name: "Alice", loan_id: 7 });

    expect(screen.getByText("Prestado")).toBeInTheDocument();
  });

  it("never renders the borrower name, even when the payload includes it", () => {
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

describe("GameCard borrow controls", () => {
  it("never renders borrow or return action buttons", () => {
    renderCard({ status: "lent", borrower_display_name: "Alice", loan_id: 7 });

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders no borrow control for available games either", () => {
    renderCard({ status: "available" });

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByText(/Solicitar préstamo/)).toBeNull();
  });
});

describe("GameCard rating badge (DQ-1)", () => {
  it("shows the BGG rating as a red square over the cover, on a scrim", () => {
    const { container } = renderCard({ bgg_rating: 8.4 });

    const rating = screen.getByText("8.4");
    expect(rating.className).toBe("game-card-rating");
    expect(container.querySelector(".game-card-rating-scrim")).toContainElement(
      rating,
    );
  });

  it("omits the rating badge when the game has no rating", () => {
    const { container } = renderCard({ bgg_rating: 0 });

    expect(container.querySelector(".game-card-rating")).toBeNull();
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
