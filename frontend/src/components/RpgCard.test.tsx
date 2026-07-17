import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RpgCard } from "./RpgCard";
import type { RpgItem } from "../types/rpg";

const RATING_CLASS = "game-card-rating";
const RIBBON_CLASS = "game-card-ribbon";
const RIBBON_LENT_CLASS = "game-card-ribbon-lent";
const TAG_CLASS = "game-card-tag";

const CORE_RULES_TYPE = "Core Rules (min needed to play)";
const ADVENTURE_TYPE = "Scenario / Adventure / Module";

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
  description_es: "",
  categories: [],
  publication_types: [],
  status: "available",
  loan_id: null,
  borrower_display_name: null,
};

interface RenderOptions {
  readonly view?: "grid" | "list";
  readonly fallbackCategory?: string;
}

function renderCard(
  overrides: Partial<RpgItem> = {},
  { view, fallbackCategory }: RenderOptions = {},
) {
  return render(
    <MemoryRouter>
      <RpgCard
        item={{ ...BASE_ITEM, ...overrides }}
        view={view}
        fallbackCategory={fallbackCategory}
      />
    </MemoryRouter>,
  );
}

describe("RpgCard content", () => {
  it("renders the item name", () => {
    renderCard();

    expect(screen.getByText("Dungeons & Dragons")).toBeInTheDocument();
  });

  it("renders the Spanish description when available", () => {
    renderCard({ description_es: "El juego de rol original." });

    expect(screen.getByText("El juego de rol original.")).toBeInTheDocument();
  });

  it("falls back to the English description", () => {
    renderCard();

    expect(screen.getByText("The original RPG.")).toBeInTheDocument();
  });

  it("renders the year as a meta item", () => {
    renderCard();

    expect(screen.getByText("1974")).toBeInTheDocument();
  });

  it("omits the year when year_published is 0", () => {
    renderCard({ year_published: 0 });

    expect(screen.queryByText("1974")).toBeNull();
  });

  it("renders the rating block with one decimal", () => {
    const { container } = renderCard({ bgg_rating: 8.5 });

    expect(screen.getByText("8.5")).toBeInTheDocument();
    expect(container.querySelector(`.${RATING_CLASS}`)).not.toBeNull();
  });

  it("omits the rating block when bgg_rating is 0", () => {
    const { container } = renderCard({ bgg_rating: 0 });

    expect(container.querySelector(`.${RATING_CLASS}`)).toBeNull();
  });
});

describe("RpgCard publication-type meta icons", () => {
  it("shows 'Manual' for rulebook-style publication types", () => {
    renderCard({ publication_types: [CORE_RULES_TYPE] });

    expect(screen.getByText("Manual")).toBeInTheDocument();
    expect(screen.queryByText("Aventura")).toBeNull();
  });

  it("shows 'Aventura' for scenario/adventure publication types", () => {
    renderCard({ publication_types: [ADVENTURE_TYPE] });

    expect(screen.getByText("Aventura")).toBeInTheDocument();
    expect(screen.queryByText("Manual")).toBeNull();
  });

  it("shows both when the item mixes rules and adventure content", () => {
    renderCard({ publication_types: [CORE_RULES_TYPE, ADVENTURE_TYPE] });

    expect(screen.getByText("Manual")).toBeInTheDocument();
    expect(screen.getByText("Aventura")).toBeInTheDocument();
  });

  it("shows neither for publication types outside both groups", () => {
    renderCard({
      publication_types: ["Accessory (dice, maps, screens, cards)"],
    });

    expect(screen.queryByText("Manual")).toBeNull();
    expect(screen.queryByText("Aventura")).toBeNull();
  });
});

describe("RpgCard status ribbon", () => {
  it("shows no ribbon when the item is available", () => {
    const { container } = renderCard({ status: "available" });

    expect(container.querySelector(`.${RIBBON_CLASS}`)).toBeNull();
  });

  it("shows the EN PRÉSTAMO ribbon when the item is lent", () => {
    const { container } = renderCard({ status: "lent" });

    const ribbon = container.querySelector(`.${RIBBON_CLASS}`);
    expect(ribbon?.textContent).toBe("EN PRÉSTAMO");
    expect(ribbon?.className).toBe(`${RIBBON_CLASS} ${RIBBON_LENT_CLASS}`);
  });
});

describe("RpgCard category tag pill", () => {
  it("translates a known category family to its Spanish pill", () => {
    const { container } = renderCard(
      {},
      { fallbackCategory: "Horror (Supernatural)" },
    );

    const tag = container.querySelector(`.${TAG_CLASS}`);
    expect(tag?.textContent).toBe("Horror");
    expect(tag?.className).toBe(`${TAG_CLASS} game-card-tag--pink`);
  });

  it("falls back to the raw category with the neutral colour", () => {
    const { container } = renderCard(
      {},
      { fallbackCategory: "Espionage" },
    );

    const tag = container.querySelector(`.${TAG_CLASS}`);
    expect(tag?.textContent).toBe("Espionage");
    expect(tag?.className).toBe(`${TAG_CLASS} game-card-tag--pearl`);
  });

  it("renders no pill without a fallback category", () => {
    const { container } = renderCard();

    expect(container.querySelector(`.${TAG_CLASS}`)).toBeNull();
  });
});

describe("RpgCard view variants", () => {
  it("renders grid variant with the rpg-card hook class by default", () => {
    const { container } = renderCard();

    expect(container.querySelector("article")?.className).toBe(
      "game-card game-card-grid rpg-card",
    );
  });

  it("renders the list variant when view is list", () => {
    const { container } = renderCard({}, { view: "list" });

    expect(container.querySelector("article")?.className).toBe(
      "game-card game-card-list rpg-card",
    );
  });
});

describe("RpgCard navigation", () => {
  it("links to /rol/<slug>", () => {
    renderCard();

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/rol/dungeons-dragons");
  });

  it("includes the item name and status in the accessible label", () => {
    renderCard({ status: "available" });

    expect(
      screen.getByRole("link", { name: "Dungeons & Dragons — Disponible" }),
    ).toBeInTheDocument();
  });
});
