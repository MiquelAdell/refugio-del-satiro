import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameDetailPage } from "./GameDetailPage";
import type { GameWithStatus } from "../types/game";
import type { LoanHistoryEntry } from "../types/loan";
import type { CurrentMember } from "../types/member";

const refetch = vi.fn();
const useGameHistoryMock = vi.fn();
const useAuthMock = vi.fn();
const apiFetchMock = vi.fn();

vi.mock("../hooks/useGameHistory", () => ({
  useGameHistory: () => useGameHistoryMock(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("../api/client", () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

const game: GameWithStatus = {
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

const member: CurrentMember = {
  id: 42,
  display_name: "Alice Smith",
  email: "alice@example.com",
  is_admin: false,
};

const admin: CurrentMember = {
  id: 99,
  display_name: "Admin User",
  email: "admin@example.com",
  is_admin: true,
};

function setHook(
  overrides: Partial<{
    game: GameWithStatus | null;
    history: readonly LoanHistoryEntry[];
    loading: boolean;
    error: string | null;
  }> = {},
) {
  useGameHistoryMock.mockReturnValue({
    game,
    history: [],
    loading: false,
    error: null,
    refetch,
    ...overrides,
  });
}

function setMember(value: CurrentMember | null) {
  useAuthMock.mockReturnValue({ member: value });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/juegos/catan"]}>
      <Routes>
        <Route path="/juegos/:slug" element={<GameDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GameDetailPage", () => {
  beforeEach(() => {
    refetch.mockReset();
    apiFetchMock.mockReset();
    apiFetchMock.mockResolvedValue({});
  });

  it("hides borrower name and shows the no-name 'Prestado' badge when payload omits the name (anonymous)", () => {
    setHook({
      game: { ...game, status: "lent", borrower_display_name: null, loan_id: null },
    });
    setMember(null);

    renderPage();

    expect(screen.getByText("Prestado")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tomar prestado/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Devolver/i })).toBeNull();
  });

  it("shows borrower name when authenticated payload includes it", () => {
    setHook({
      game: {
        ...game,
        status: "lent",
        borrower_display_name: "Bob Jones",
        loan_id: 7,
      },
    });
    setMember(member);

    renderPage();

    expect(screen.getByText("Prestado a Bob Jones")).toBeInTheDocument();
  });

  it("shows the borrow CTA only for an available game with a logged-in member", () => {
    setHook();
    setMember(member);

    renderPage();

    expect(screen.getByRole("button", { name: "Tomar prestado" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Devolver" })).toBeNull();
  });

  it("hides the borrow CTA when the viewer is anonymous", () => {
    setHook();
    setMember(null);

    renderPage();

    expect(screen.queryByRole("button", { name: "Tomar prestado" })).toBeNull();
  });

  it("shows the return CTA to the borrower of a lent game", () => {
    setHook({
      game: {
        ...game,
        status: "lent",
        borrower_display_name: member.display_name,
        loan_id: 7,
      },
    });
    setMember(member);

    renderPage();

    expect(screen.getByRole("button", { name: "Devolver" })).toBeInTheDocument();
  });

  it("shows the return CTA to an admin even when the loan is someone else's", () => {
    setHook({
      game: {
        ...game,
        status: "lent",
        borrower_display_name: "Bob Jones",
        loan_id: 7,
      },
    });
    setMember(admin);

    renderPage();

    expect(screen.getByRole("button", { name: "Devolver" })).toBeInTheDocument();
  });

  it("hides the return CTA from a non-admin who is not the borrower", () => {
    setHook({
      game: {
        ...game,
        status: "lent",
        borrower_display_name: "Bob Jones",
        loan_id: 7,
      },
    });
    setMember(member);

    renderPage();

    expect(screen.queryByRole("button", { name: "Devolver" })).toBeNull();
  });

  it("calls POST /loans and refetches after confirming a borrow", async () => {
    setHook();
    setMember(member);

    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Tomar prestado" }));
    // The dialog confirm button reuses the same label; the trigger is also still in the DOM.
    const buttons = screen.getAllByRole("button", { name: "Tomar prestado" });
    await user.click(buttons[buttons.length - 1]);

    expect(apiFetchMock).toHaveBeenCalledWith("/loans", {
      method: "POST",
      body: JSON.stringify({ game_id: 1 }),
    });
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
