import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogPage } from "./CatalogPage";
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
  min_age: 10,
  bgg_rating: 7.2,
  location: "armario",
  description: "",
  description_es: "",
  categories: [],
  primary_tag: "familygames",
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
  location: "sotano",
  status: "lent",
};

const FILTROS_TAB = "Filtros";
const AVAILABILITY_SELECT = "Disponibilidad";
const MIN_PLAYERS_THUMB = "Jugadores mínimo";
const MAX_PLAYERS_THUMB = "Jugadores máximo";

function setGames(
  games: readonly GameWithStatus[] = [AVAILABLE_GAME, LENT_GAME],
) {
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
  localStorage.clear();
  setGames();
});

async function openFiltrosTab(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("tab", { name: FILTROS_TAB }));
}

describe("CatalogPage filter chips", () => {
  it("adds a removable chip when a filter is applied and re-queries on removal", async () => {
    renderPage();
    const user = userEvent.setup();

    expect(screen.getByText("Azul")).toBeInTheDocument();

    await openFiltrosTab(user);
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

    await openFiltrosTab(user);
    await user.selectOptions(
      screen.getByLabelText(AVAILABILITY_SELECT),
      "available",
    );
    await user.selectOptions(screen.getByLabelText("Ubicación"), "armario");

    const removeButtons = screen.getAllByRole("button", {
      name: "Quitar filtro",
    });
    expect(removeButtons).toHaveLength(2);
  });

  it("combines search and filters and removes each condition independently", async () => {
    vi.useFakeTimers();
    renderPage();

    fireEvent.change(screen.getByLabelText("Buscar juego por nombre..."), {
      target: { value: "catan" },
    });
    act(() => vi.advanceTimersByTime(350));
    fireEvent.click(screen.getByRole("tab", { name: FILTROS_TAB }));
    fireEvent.change(screen.getByLabelText(AVAILABILITY_SELECT), {
      target: { value: "available" },
    });

    expect(screen.getByText("Mostrando 1 de 2")).toBeInTheDocument();
    expect(screen.getByText("Palabra clave: “catan”")).toBeInTheDocument();
    const activeFilters = screen.getByLabelText("Filtros activos");
    expect(within(activeFilters).getByText("Disponible")).toBeInTheDocument();

    const searchChip = screen
      .getByText("Palabra clave: “catan”")
      .closest('[role="status"]') as HTMLElement;
    fireEvent.click(
      within(searchChip).getByRole("button", { name: "Quitar filtro" }),
    );

    expect(screen.getByText("Catan")).toBeInTheDocument();
    expect(screen.queryByText("Azul")).toBeNull();
    expect(screen.queryByText("Palabra clave: “catan”")).toBeNull();
    expect(within(activeFilters).getByText("Disponible")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("clears search and filters while preserving the selected sort order", () => {
    vi.useFakeTimers();
    renderPage();

    fireEvent.change(screen.getByLabelText("Ordenar por"), {
      target: { value: "name-desc" },
    });
    fireEvent.change(screen.getByLabelText("Buscar juego por nombre..."), {
      target: { value: "catan" },
    });
    act(() => vi.advanceTimersByTime(350));
    fireEvent.click(screen.getByRole("tab", { name: FILTROS_TAB }));
    fireEvent.change(screen.getByLabelText(AVAILABILITY_SELECT), {
      target: { value: "available" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Limpiar búsqueda y filtros" }),
    );

    expect(screen.getByLabelText("Ordenar por")).toHaveValue("name-desc");
    expect(screen.getByText("Mostrando 2 de 2")).toBeInTheDocument();
    expect(screen.queryByLabelText("Filtros activos")).toBeNull();

    vi.useRealTimers();
  });

  it("does not restore pending search text after removing its active chip", () => {
    vi.useFakeTimers();
    renderPage();

    const searchInput = screen.getByLabelText("Buscar juego por nombre...");
    fireEvent.change(searchInput, { target: { value: "catan" } });
    act(() => vi.advanceTimersByTime(350));

    fireEvent.change(searchInput, { target: { value: "azul" } });
    const searchChip = screen
      .getByText("Palabra clave: “catan”")
      .closest('[role="status"]') as HTMLElement;
    fireEvent.click(
      within(searchChip).getByRole("button", { name: "Quitar filtro" }),
    );
    act(() => vi.advanceTimersByTime(350));

    expect(searchInput).toHaveValue("");
    expect(screen.queryByLabelText("Filtros activos")).toBeNull();
    expect(screen.getByText("Catan")).toBeInTheDocument();
    expect(screen.getByText("Azul")).toBeInTheDocument();

    vi.useRealTimers();
  });
});

describe("CatalogPage search-and-filters box", () => {
  it("shows the search input on the default Buscador tab and no filter controls", () => {
    renderPage();

    expect(
      screen.getByLabelText("Buscar juego por nombre..."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(AVAILABILITY_SELECT)).not.toBeVisible();
  });

  it("reveals the filter controls when the Filtros tab is activated", async () => {
    renderPage();
    const user = userEvent.setup();

    await openFiltrosTab(user);

    expect(screen.getByLabelText(AVAILABILITY_SELECT)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: FILTROS_TAB })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("keeps sorting available from both search and filter tabs", async () => {
    renderPage();
    const user = userEvent.setup();

    expect(screen.getByLabelText("Ordenar por")).toBeVisible();
    await openFiltrosTab(user);
    expect(screen.getByLabelText("Ordenar por")).toBeVisible();
  });

  it("shows the results count line", () => {
    renderPage();

    expect(screen.getByText("Mostrando 2 de 2")).toBeInTheDocument();
  });

  it("filters the grid by typed search text from the Buscador tab", async () => {
    vi.useFakeTimers();
    renderPage();

    const searchInput = screen.getByLabelText("Buscar juego por nombre...");
    fireEvent.change(searchInput, { target: { value: "azul" } });
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(screen.getByText("Azul")).toBeInTheDocument();
    expect(screen.queryByText("Catan")).toBeNull();

    vi.useRealTimers();
  });
});

describe("CatalogPage player-range slider", () => {
  it("moves the min handle with arrow keys and updates aria-valuenow", async () => {
    renderPage();
    const user = userEvent.setup();
    await openFiltrosTab(user);

    const minThumb = screen.getByRole("slider", { name: MIN_PLAYERS_THUMB });
    expect(minThumb).toHaveAttribute("aria-valuenow", "1");

    act(() => {
      minThumb.focus();
    });
    fireEvent.keyDown(minThumb, { key: "ArrowRight" });

    expect(minThumb).toHaveAttribute("aria-valuenow", "2");
  });

  it("supports Home on the min handle and End on the max handle", async () => {
    renderPage();
    const user = userEvent.setup();
    await openFiltrosTab(user);

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

  it("filters the grid when the range excludes a game", async () => {
    renderPage();
    const user = userEvent.setup();
    await openFiltrosTab(user);

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
    expect(
      screen.getByText("No se han encontrado juegos."),
    ).toBeInTheDocument();
  });
});

describe("CatalogPage player-age filter", () => {
  it("offers ages 3 through 18 and excludes unknown ages while active", async () => {
    setGames([
      { ...AVAILABLE_GAME, name: "Apto", min_age: 8 },
      { ...LENT_GAME, name: "Mayor", min_age: 12 },
      { ...LENT_GAME, id: 3, name: "Sin edad", min_age: 0 },
    ]);
    renderPage();
    const user = userEvent.setup();
    await openFiltrosTab(user);

    const ageSelect = screen.getByLabelText("Edad del jugador");
    expect(
      within(ageSelect)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual([
      "Todas",
      ...Array.from({ length: 16 }, (_, index) => `${index + 3} años`),
    ]);

    await user.selectOptions(ageSelect, "8");

    expect(screen.getByText("Apto")).toBeInTheDocument();
    expect(screen.queryByText("Mayor")).toBeNull();
    expect(screen.queryByText("Sin edad")).toBeNull();
    expect(screen.getByText("Edad del jugador: 8 años")).toBeInTheDocument();
  });
});

describe("CatalogPage catalog type toggle and banner", () => {
  it("uses the concise catalog heading from the reference design", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Catálogo" }),
    ).toBeInTheDocument();
  });

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

describe("CatalogPage tag pill fallback", () => {
  it("shows the game's most common own category when primary_tag is empty", () => {
    setGames([
      { ...AVAILABLE_GAME, primary_tag: "", categories: ["Economic"] },
      { ...LENT_GAME, primary_tag: "", categories: ["Economic", "Fantasy"] },
    ]);

    renderPage();

    // "Economic" wins the frequency tie-break (appears on both games).
    expect(screen.getAllByText("Economic")).toHaveLength(2);
  });
});
