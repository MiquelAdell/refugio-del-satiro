import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogPage } from "./CatalogPage";
import { installMatchMediaMock, setMatchMedia } from "../../tests/matchMedia";
import type { GameWithStatus } from "../types/game";

const useGamesMock = vi.fn();

vi.mock("../hooks/useGames", () => ({
  useGames: () => useGamesMock(),
}));

const AVAILABLE_GAME: GameWithStatus = {
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
  location: "armari",
  status: "available",
  borrower_display_name: null,
  loan_id: null,
};

const LENT_GAME: GameWithStatus = {
  ...AVAILABLE_GAME,
  id: 2,
  bgg_id: 200,
  name: "Azul",
  slug: "azul",
  min_players: 2,
  max_players: 4,
  playing_time: 45,
  bgg_rating: 7.8,
  location: "soterrani",
  status: "lent",
};

const SIDEBAR_LABEL = "Filtros";
const AVAILABILITY_SELECT = "Disponibilidad";
const MIN_PLAYERS_THUMB = "Jugadores mínimo";
const MAX_PLAYERS_THUMB = "Jugadores máximo";

function setGames(games: readonly GameWithStatus[] = [AVAILABLE_GAME, LENT_GAME]) {
  useGamesMock.mockReturnValue({
    games,
    loading: false,
    error: null,
    refetch: vi.fn(),
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <CatalogPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  installMatchMediaMock();
  localStorage.clear();
  setGames();
});

describe("CatalogPage filter chips", () => {
  it("adds a removable chip when a filter is applied and re-queries on removal", async () => {
    renderPage();
    const user = userEvent.setup();

    expect(screen.getByText("Azul")).toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText(AVAILABILITY_SELECT),
      "available",
    );

    expect(screen.queryByText("Azul")).toBeNull();
    expect(screen.getByText("Catan")).toBeInTheDocument();
    const chips = screen.getByLabelText("Filtros activos");
    expect(chips).toHaveTextContent("Disponible");

    await user.click(screen.getByRole("button", { name: "Quitar filtro" }));

    expect(screen.getByText("Azul")).toBeInTheDocument();
    expect(screen.queryByLabelText("Filtros activos")).toBeNull();
  });

  it("stacks one chip per active filter", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByLabelText(AVAILABILITY_SELECT),
      "available",
    );
    await user.selectOptions(screen.getByLabelText("Ubicación"), "armari");

    const removeButtons = screen.getAllByRole("button", {
      name: "Quitar filtro",
    });
    expect(removeButtons).toHaveLength(2);
  });
});

describe("CatalogPage responsive filter surface", () => {
  it("shows the fixed side panel and no Filtros trigger at >=1024px", () => {
    renderPage();

    expect(
      screen.getByRole("complementary", { name: SIDEBAR_LABEL }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: SIDEBAR_LABEL })).toBeNull();
  });

  it("switches to the drawer trigger below 1024px and opens the drawer", async () => {
    renderPage();

    act(() => {
      setMatchMedia(() => false);
    });

    expect(
      screen.queryByRole("complementary", { name: SIDEBAR_LABEL }),
    ).toBeNull();
    const trigger = screen.getByRole("button", { name: SIDEBAR_LABEL });

    const user = userEvent.setup();
    await user.click(trigger);

    expect(screen.getByRole("dialog", { name: SIDEBAR_LABEL })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cerrar filtros" }));
    expect(screen.queryByRole("dialog", { name: SIDEBAR_LABEL })).toBeNull();
  });
});

describe("CatalogPage player-range slider", () => {
  it("moves the min handle with arrow keys and updates aria-valuenow", () => {
    renderPage();

    const minThumb = screen.getByRole("slider", { name: MIN_PLAYERS_THUMB });
    expect(minThumb).toHaveAttribute("aria-valuenow", "1");

    act(() => {
      minThumb.focus();
    });
    fireEvent.keyDown(minThumb, { key: "ArrowRight" });

    expect(minThumb).toHaveAttribute("aria-valuenow", "2");
  });

  it("supports Home on the min handle and End on the max handle", () => {
    renderPage();

    const minThumb = screen.getByRole("slider", { name: MIN_PLAYERS_THUMB });
    act(() => {
      minThumb.focus();
    });
    fireEvent.keyDown(minThumb, { key: "ArrowRight" });
    expect(minThumb).toHaveAttribute("aria-valuenow", "2");
    fireEvent.keyDown(minThumb, { key: "Home" });
    expect(minThumb).toHaveAttribute("aria-valuenow", "1");

    const maxThumb = screen.getByRole("slider", { name: MAX_PLAYERS_THUMB });
    act(() => {
      maxThumb.focus();
    });
    fireEvent.keyDown(maxThumb, { key: "ArrowLeft" });
    expect(maxThumb).toHaveAttribute("aria-valuenow", "11");
    fireEvent.keyDown(maxThumb, { key: "End" });
    expect(maxThumb).toHaveAttribute("aria-valuenow", "12");
  });

  it("filters the grid when the range excludes a game", () => {
    renderPage();

    const minThumb = screen.getByRole("slider", { name: MIN_PLAYERS_THUMB });
    act(() => {
      minThumb.focus();
    });
    // Both fixtures top out at 4 players, so a minimum of 5 excludes them.
    fireEvent.keyDown(minThumb, { key: "ArrowRight" });
    fireEvent.keyDown(minThumb, { key: "ArrowRight" });
    fireEvent.keyDown(minThumb, { key: "ArrowRight" });
    fireEvent.keyDown(minThumb, { key: "ArrowRight" });

    expect(screen.queryByText("Catan")).toBeNull();
    expect(screen.queryByText("Azul")).toBeNull();
    expect(screen.getByText("No se han encontrado juegos.")).toBeInTheDocument();
  });
});

describe("CatalogPage catalog type toggle and banner", () => {
  it("renders the catalog type toggle with both links", () => {
    renderPage();

    expect(
      screen.getByRole("link", { name: "Juegos de mesa" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Libros de rol" }),
    ).toBeInTheDocument();
  });

  it("renders the powered-by-bgg banner", () => {
    renderPage();

    expect(
      screen.getByRole("link", { name: /BoardGameGeek/i }),
    ).toBeInTheDocument();
  });
});

describe("CatalogPage view toggle (DQ-2)", () => {
  it("defaults to grid view", () => {
    const { container } = renderPage();

    expect(container.querySelector(".catalog-grid")).not.toBeNull();
    expect(container.querySelector(".catalog-list")).toBeNull();
  });

  it("switches to list view and persists the choice in localStorage", async () => {
    const { container, unmount } = renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Vista de lista" }));

    expect(container.querySelector(".catalog-list")).not.toBeNull();
    expect(localStorage.getItem("catalog-view-mode")).toBe("list");

    unmount();
    const { container: remounted } = renderPage();
    expect(remounted.querySelector(".catalog-list")).not.toBeNull();
  });
});
