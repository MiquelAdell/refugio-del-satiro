import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RpgCard } from "./RpgCard";
import type { RpgItem } from "../types/rpg";

const BASE_ITEM: RpgItem = {
  id: 1,
  bgg_id: 999,
  name: "Dungeons & Dragons",
  slug: "dungeons-dragons",
  thumbnail_url: "https://example.com/dnd-thumb.jpg",
  image_url: "https://example.com/dnd-large.jpg",
  year_published: 1974,
  bgg_rating: 8.5,
  description: "The original RPG.",
};

function renderCard(overrides: Partial<RpgItem> = {}) {
  return render(
    <MemoryRouter>
      <RpgCard item={{ ...BASE_ITEM, ...overrides }} />
    </MemoryRouter>,
  );
}

describe("RpgCard content", () => {
  it("renders the item name", () => {
    renderCard();

    expect(screen.getByText("Dungeons & Dragons")).toBeInTheDocument();
  });

  it("renders the year when present", () => {
    renderCard();

    expect(screen.getByText("1974")).toBeInTheDocument();
  });

  it("omits the year when year_published is 0", () => {
    renderCard({ year_published: 0 });

    expect(screen.queryByText("1974")).toBeNull();
  });

  it("renders the rating badge with one decimal", () => {
    const { container } = renderCard({ bgg_rating: 8.5 });

    expect(screen.getByText("8.5")).toBeInTheDocument();
    expect(container.querySelector(".rpg-card-rating-scrim")).not.toBeNull();
  });

  it("omits the rating badge when bgg_rating is 0", () => {
    const { container } = renderCard({ bgg_rating: 0 });

    expect(container.querySelector(".rpg-card-rating")).toBeNull();
  });
});

describe("RpgCard no status badge", () => {
  it("never renders an availability badge", () => {
    renderCard();

    expect(screen.queryByText("Disponible")).toBeNull();
    expect(screen.queryByText("Prestado")).toBeNull();
  });
});

describe("RpgCard navigation", () => {
  it("links to /rol/<slug>", () => {
    renderCard();

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/rol/dungeons-dragons");
  });

  it("uses the item name as the accessible label", () => {
    renderCard();

    expect(
      screen.getByRole("link", { name: "Dungeons & Dragons" }),
    ).toBeInTheDocument();
  });
});
