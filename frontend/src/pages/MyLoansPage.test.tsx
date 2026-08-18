import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActiveLoan } from "../types/loan";
import { BORROW_SUCCESS_MESSAGE } from "../lib/loanActions";
import { MyLoansPage } from "./MyLoansPage";

const useMyLoansMock = vi.fn();

vi.mock("../hooks/useMyLoans", () => ({
  useMyLoans: () => useMyLoansMock(),
}));

const BOARD_GAME_LOAN: ActiveLoan = {
  loan_id: 7,
  game_id: 1,
  game_slug: "catan",
  item_type: "boardgame",
  game_name: "Catan",
  game_thumbnail_url: "https://example.com/catan.jpg",
  game_image_url: "https://example.com/catan-large.jpg",
  borrowed_at: "2026-08-10T12:00:00Z",
};

const RPG_LOAN: ActiveLoan = {
  ...BOARD_GAME_LOAN,
  loan_id: 8,
  game_id: 2,
  game_slug: "dungeons-dragons",
  item_type: "rpgitem",
  game_name: "Dungeons & Dragons",
};

function renderPage(loans: readonly ActiveLoan[]) {
  useMyLoansMock.mockReturnValue({
    loans,
    loading: false,
    error: null,
    refetch: vi.fn(),
  });

  return render(
    <MemoryRouter>
      <MyLoansPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-17T12:00:00Z"));
});

describe("MyLoansPage guidance", () => {
  it("places the responsible-use guidance directly below the title in the empty state", () => {
    renderPage([]);

    const title = screen.getByRole("heading", { name: "Mis préstamos" });
    const guidance = screen.getByText(BORROW_SUCCESS_MESSAGE);

    expect(title.nextElementSibling).toEqual(guidance);
    expect(
      screen.getByText("No tienes ningún juego en préstamo."),
    ).toBeInTheDocument();
  });
});

describe("MyLoansPage item links", () => {
  it("links a board-game cover and title to its board-game detail page", () => {
    renderPage([BOARD_GAME_LOAN]);

    expect(
      screen.getByRole("link", { name: "Ver detalles de Catan" }),
    ).toHaveAttribute("href", "/juegos/catan");
    expect(screen.getByRole("link", { name: "Catan" })).toHaveAttribute(
      "href",
      "/juegos/catan",
    );
    expect(
      screen.getByRole("button", { name: "Devolver" }).closest("a"),
    ).toEqual(null);
  });

  it("links an RPG cover and title to its RPG detail page", () => {
    renderPage([RPG_LOAN]);

    expect(
      screen.getByRole("link", { name: "Ver detalles de Dungeons & Dragons" }),
    ).toHaveAttribute("href", "/rol/dungeons-dragons");
    expect(
      screen.getByRole("link", { name: "Dungeons & Dragons" }),
    ).toHaveAttribute("href", "/rol/dungeons-dragons");
  });
});

describe("MyLoansPage age notice", () => {
  it("shows the informational label for a loan at exactly 30 days", () => {
    renderPage([{ ...BOARD_GAME_LOAN, borrowed_at: "2026-07-18T12:00:00Z" }]);

    expect(
      screen.getByText("Lleva 30 días o más en préstamo."),
    ).toBeInTheDocument();
  });

  it("does not show the informational label before 30 complete days", () => {
    renderPage([{ ...BOARD_GAME_LOAN, borrowed_at: "2026-07-18T12:01:00Z" }]);

    expect(screen.queryByText("Lleva 30 días o más en préstamo.")).toEqual(
      null,
    );
  });
});
