import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RpgCatalogPage } from "./RpgCatalogPage";
import type { RpgItem } from "../types/rpg";

const useRpgItemsMock = vi.fn();

vi.mock("../hooks/useRpgItems", () => ({
  useRpgItems: () => useRpgItemsMock(),
}));

const ITEM_A: RpgItem = {
  id: 1,
  bgg_id: 101,
  name: "Ars Magica",
  slug: "ars-magica",
  thumbnail_url: "https://example.com/ars.jpg",
  image_url: "https://example.com/ars-large.jpg",
  year_published: 1987,
  bgg_rating: 7.9,
  description: "Wizards in medieval Europe.",
  categories: [],
  publication_types: [],
  status: "available",
  loan_id: null,
  borrower_display_name: null,
};

const ITEM_B: RpgItem = {
  id: 2,
  bgg_id: 102,
  name: "Vampire: The Masquerade",
  slug: "vampire-the-masquerade",
  thumbnail_url: "https://example.com/vtm.jpg",
  image_url: "https://example.com/vtm-large.jpg",
  year_published: 1991,
  bgg_rating: 8.6,
  description: "Gothic horror RPG.",
  categories: [],
  publication_types: [],
  status: "available",
  loan_id: null,
  borrower_display_name: null,
};

const ITEM_C: RpgItem = {
  id: 3,
  bgg_id: 103,
  name: "Pathfinder",
  slug: "pathfinder",
  thumbnail_url: "https://example.com/pf.jpg",
  image_url: "https://example.com/pf-large.jpg",
  year_published: 2009,
  bgg_rating: 7.2,
  description: "Fantasy RPG.",
  categories: [],
  publication_types: [],
  status: "available",
  loan_id: null,
  borrower_display_name: null,
};

const ALL_ITEMS = [ITEM_A, ITEM_B, ITEM_C] as const;

function setItems(items: readonly RpgItem[] = ALL_ITEMS) {
  useRpgItemsMock.mockReturnValue({
    items,
    loading: false,
    error: null,
    refetch: vi.fn(),
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/juegos-de-rol"]}>
      <RpgCatalogPage />
    </MemoryRouter>,
  );
}

function getItemNames(): string[] {
  return screen
    .getAllByRole("link", { name: /.+/ })
    .map((el) => el.getAttribute("aria-label") ?? el.textContent ?? "")
    .flatMap((label) => {
      const match = ALL_ITEMS.find((item) => label.startsWith(item.name));
      return match ? [match.name] : [];
    });
}

beforeEach(() => {
  setItems();
});

describe("RpgCatalogPage loading state", () => {
  it("shows loading message while fetching", () => {
    useRpgItemsMock.mockReturnValue({
      items: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText("Cargando libros...")).toBeInTheDocument();
  });
});

describe("RpgCatalogPage empty state", () => {
  it("shows no results message when list is empty after filtering", () => {
    vi.useFakeTimers();
    renderPage();

    const searchInput = screen.getByRole("textbox", { name: /buscar libros/i });
    fireEvent.change(searchInput, { target: { value: "zzzzzzz" } });
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(screen.getByText("No se han encontrado libros.")).toBeInTheDocument();

    vi.useRealTimers();
  });
});

describe("RpgCatalogPage name-asc sort (default)", () => {
  it("renders items in ascending name order by default", () => {
    renderPage();

    const names = getItemNames();
    expect(names).toEqual(["Ars Magica", "Pathfinder", "Vampire: The Masquerade"]);
  });
});

describe("RpgCatalogPage name-desc sort", () => {
  it("renders items in descending name order when sort is changed", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole("tab", { name: "Filtros" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: /ordenar por/i }),
      "name-desc",
    );

    const names = getItemNames();
    expect(names).toEqual(["Vampire: The Masquerade", "Pathfinder", "Ars Magica"]);
  });
});

describe("RpgCatalogPage rating sort", () => {
  it("renders items from highest to lowest rating when rating sort is selected", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole("tab", { name: "Filtros" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: /ordenar por/i }),
      "rating",
    );

    const names = getItemNames();
    // ITEM_B: 8.6, ITEM_A: 7.9, ITEM_C: 7.2
    expect(names).toEqual(["Vampire: The Masquerade", "Ars Magica", "Pathfinder"]);
  });
});

describe("RpgCatalogPage search filtering", () => {
  it("filters items by name (case-insensitive)", () => {
    vi.useFakeTimers();
    renderPage();

    const searchInput = screen.getByRole("textbox", { name: /buscar libros/i });
    fireEvent.change(searchInput, { target: { value: "vampire" } });
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(screen.getByText("Vampire: The Masquerade")).toBeInTheDocument();
    expect(screen.queryByText("Ars Magica")).toBeNull();
    expect(screen.queryByText("Pathfinder")).toBeNull();

    vi.useRealTimers();
  });

  it("restores all items when search is cleared", () => {
    vi.useFakeTimers();
    renderPage();

    const searchInput = screen.getByRole("textbox", { name: /buscar libros/i });
    fireEvent.change(searchInput, { target: { value: "pathfinder" } });
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(screen.getByText("Pathfinder")).toBeInTheDocument();
    expect(screen.queryByText("Ars Magica")).toBeNull();

    fireEvent.change(searchInput, { target: { value: "" } });
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(screen.getByText("Ars Magica")).toBeInTheDocument();
    expect(screen.getByText("Vampire: The Masquerade")).toBeInTheDocument();
    expect(screen.getByText("Pathfinder")).toBeInTheDocument();

    vi.useRealTimers();
  });
});

describe("RpgCatalogPage results count", () => {
  it("shows the results count line", () => {
    renderPage();

    expect(screen.getByText("Mostrando 3 de 3")).toBeInTheDocument();
  });
});

describe("RpgCatalogPage catalog toggle and banner", () => {
  it("renders the catalog type toggle", () => {
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
