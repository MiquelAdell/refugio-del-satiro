import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { GameCard } from "./GameCard";
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
  status: "available",
  borrower_display_name: null,
  loan_id: null,
};

function renderCard(overrides: Partial<GameWithStatus> = {}) {
  return render(
    <MemoryRouter>
      <GameCard game={{ ...baseGame, ...overrides }} />
    </MemoryRouter>,
  );
}

describe("GameCard", () => {
  it("never renders borrow or return action buttons", () => {
    renderCard({ status: "lent", borrower_display_name: "Alice", loan_id: 7 });

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("never renders the borrower name, even when the payload includes it", () => {
    renderCard({ status: "lent", borrower_display_name: "Alice", loan_id: 7 });

    expect(screen.queryByText(/Alice/)).toBeNull();
  });

  it("renders 'Disponible' for an available game", () => {
    renderCard({ status: "available" });

    expect(screen.getByText("Disponible")).toBeInTheDocument();
  });

  it("renders the no-name 'Prestado' badge for a lent game", () => {
    renderCard({ status: "lent", borrower_display_name: "Alice", loan_id: 7 });

    expect(screen.getByText("Prestado")).toBeInTheDocument();
  });

  it("links to the game detail page using the slug", () => {
    renderCard();

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/juegos/catan");
  });
});
