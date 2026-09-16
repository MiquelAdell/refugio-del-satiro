import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import type { AdminActiveLoan } from "../types/loan";
import { AdminLoansPage } from "./AdminLoansPage";

const useAuthMock = vi.fn();
const useAdminActiveLoansMock = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("../hooks/useAdminActiveLoans", () => ({
  useAdminActiveLoans: (enabled: boolean) => useAdminActiveLoansMock(enabled),
}));

const ADMIN = {
  id: 1,
  display_name: "Admin User",
  email: "admin@example.invalid",
  is_admin: true,
};

const BOARDGAME_LOAN: AdminActiveLoan = {
  loan_id: 7,
  game_id: 1,
  game_slug: "catan",
  item_type: "boardgame",
  game_name: "Catan",
  game_thumbnail_url: "https://example.com/catan.jpg",
  game_image_url: "https://example.com/catan-large.jpg",
  member_id: 42,
  member_display_name: "Ana García",
  borrowed_at: "2026-08-10T12:00:00Z",
};

const RPG_LOAN: AdminActiveLoan = {
  ...BOARDGAME_LOAN,
  loan_id: 8,
  game_id: 2,
  game_slug: "vampiro-la-mascarada",
  item_type: "rpgitem",
  game_name: "Vampiro: La Mascarada",
  member_id: 43,
  member_display_name: "Luis Martínez",
  borrowed_at: "2026-08-11T12:00:00Z",
};

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminLoansPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthMock.mockReturnValue({ member: ADMIN, loading: false });
  useAdminActiveLoansMock.mockReturnValue({
    loans: [],
    loading: false,
    error: null,
  });
});

describe("AdminLoansPage access and loading", () => {
  it("shows loading copy while authentication is loading", () => {
    useAuthMock.mockReturnValue({ member: null, loading: true });

    renderPage();

    expect(screen.getByText("Cargando…")).toBeInTheDocument();
    expect(useAdminActiveLoansMock).toHaveBeenCalledWith(false);
  });

  it("keeps the page restricted for a non-administrator", () => {
    useAuthMock.mockReturnValue({ member: { ...ADMIN, is_admin: false }, loading: false });

    renderPage();

    expect(
      screen.getByText("Acceso restringido a administradores."),
    ).toBeInTheDocument();
    expect(useAdminActiveLoansMock).toHaveBeenCalledWith(false);
  });

  it("shows the loan request loading state for an administrator", () => {
    useAdminActiveLoansMock.mockReturnValue({ loans: [], loading: true, error: null });

    renderPage();

    expect(screen.getByText("Cargando…")).toBeInTheDocument();
    expect(useAdminActiveLoansMock).toHaveBeenCalledWith(true);
  });
});

describe("AdminLoansPage results", () => {
  it("shows the API error", () => {
    useAdminActiveLoansMock.mockReturnValue({
      loans: [],
      loading: false,
      error: "No se han podido cargar los préstamos activos.",
    });

    renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se han podido cargar los préstamos activos.",
    );
  });

  it("shows the empty state", () => {
    renderPage();

    expect(screen.getByText("No hay préstamos activos.")).toBeInTheDocument();
  });

  it("shows requested board-game and RPG loan fields with Spanish dates and detail links", () => {
    useAdminActiveLoansMock.mockReturnValue({
      loans: [BOARDGAME_LOAN, RPG_LOAN],
      loading: false,
      error: null,
    });

    renderPage();

    expect(screen.getByRole("heading", { name: "Préstamos activos" })).toBeInTheDocument();
    expect(screen.getByText("Juego de mesa")).toBeInTheDocument();
    expect(screen.getByText("Juego de rol")).toBeInTheDocument();
    expect(screen.getByText("Ana García")).toBeInTheDocument();
    expect(screen.getByText("Luis Martínez")).toBeInTheDocument();
    expect(screen.getByText("10 ago 2026")).toBeInTheDocument();
    expect(screen.getByText("11 ago 2026")).toBeInTheDocument();
    expect(screen.getAllByRole("presentation")[0]).toHaveAttribute(
      "src",
      "https://example.com/catan.jpg",
    );
    expect(screen.getByRole("link", { name: "Catan" })).toHaveAttribute("href", "/juegos/catan");
    expect(screen.getByRole("link", { name: "Vampiro: La Mascarada" })).toHaveAttribute(
      "href",
      "/rol/vampiro-la-mascarada",
    );
    expect(screen.getByRole("link", { name: "Ver detalles de Catan" })).toHaveAttribute(
      "href",
      "/juegos/catan",
    );
  });

  it("sorts by member and loan date from the visible headers", async () => {
    const user = userEvent.setup();
    useAdminActiveLoansMock.mockReturnValue({
      loans: [RPG_LOAN, BOARDGAME_LOAN],
      loading: false,
      error: null,
    });

    renderPage();

    const memberHeader = screen.getByRole("button", { name: "Socio" });
    await user.click(memberHeader);
    expect(memberHeader).toHaveAttribute("aria-sort", "ascending");
    expect(
      screen.getAllByRole("article").map((row) => row.textContent),
    ).toEqual([expect.stringContaining("Ana García"), expect.stringContaining("Luis Martínez")]);

    await user.click(memberHeader);
    expect(memberHeader).toHaveAttribute("aria-sort", "descending");
    expect(
      screen.getAllByRole("article").map((row) => row.textContent),
    ).toEqual([expect.stringContaining("Luis Martínez"), expect.stringContaining("Ana García")]);

    const borrowedHeader = screen.getByRole("button", { name: "Prestado el" });
    await user.click(borrowedHeader);
    expect(borrowedHeader).toHaveAttribute("aria-sort", "ascending");
    expect(
      screen.getAllByRole("article").map((row) => row.textContent),
    ).toEqual([expect.stringContaining("10 ago 2026"), expect.stringContaining("11 ago 2026")]);
  });
});
