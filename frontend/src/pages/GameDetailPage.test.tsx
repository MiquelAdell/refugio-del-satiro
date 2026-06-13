import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameDetailPage } from "./GameDetailPage";
import { CatalogModeProvider } from "../context/CatalogModeContext";
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

const BORROW_CTA = "Solicitar préstamo";
const RETURN_CTA = "Devolver";
const LOGIN_LINK = "Iniciar sesión";
const HISTORY_HEADING = /Historial de préstamos y comentarios/i;

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

const historyEntry: LoanHistoryEntry = {
  member_display_name: "Bob Jones",
  borrowed_at: "2026-01-10T10:00:00Z",
  returned_at: "2026-01-20T10:00:00Z",
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
  useAuthMock.mockReturnValue({ member: value, loading: false });
}

function renderPage() {
  return render(
    <CatalogModeProvider>
      <MemoryRouter initialEntries={["/juegos/catan"]}>
        <Routes>
          <Route path="/juegos/:slug" element={<GameDetailPage />} />
        </Routes>
      </MemoryRouter>
    </CatalogModeProvider>,
  );
}

describe("GameDetailPage borrow CTA", () => {
  beforeEach(() => {
    refetch.mockReset();
    apiFetchMock.mockReset();
    apiFetchMock.mockResolvedValue({});
  });

  it("shows the borrow CTA for an available game with a logged-in member", () => {
    setHook();
    setMember(member);

    renderPage();

    expect(screen.getByRole("button", { name: BORROW_CTA })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: RETURN_CTA })).toBeNull();
  });

  it("shows the non-actionable 'Prestado' status instead of the CTA for a lent game", () => {
    setHook({
      game: { ...game, status: "lent", borrower_display_name: null, loan_id: null },
    });
    setMember(null);

    renderPage();

    expect(screen.getByText("Prestado")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: BORROW_CTA })).toBeNull();
    expect(screen.queryByRole("button", { name: RETURN_CTA })).toBeNull();
  });

  it("hides the borrow CTA and offers login when the viewer is anonymous", () => {
    setHook();
    setMember(null);

    renderPage();

    expect(screen.queryByRole("button", { name: BORROW_CTA })).toBeNull();
    expect(screen.getByRole("link", { name: LOGIN_LINK })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("calls POST /loans and refetches after confirming a borrow", async () => {
    setHook();
    setMember(member);

    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: BORROW_CTA }));
    // The dialog confirm button reuses the same label; the trigger is also still in the DOM.
    const buttons = screen.getAllByRole("button", { name: BORROW_CTA });
    await user.click(buttons[buttons.length - 1]);

    expect(apiFetchMock).toHaveBeenCalledWith("/loans", {
      method: "POST",
      body: JSON.stringify({ game_id: 1 }),
    });
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});

describe("GameDetailPage anonymous mode (/ludoteca unauthenticated)", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it("shows a login link for anonymous user viewing an available game", () => {
    setHook();
    setMember(null);

    renderPage();

    expect(screen.queryByRole("button", { name: BORROW_CTA })).toBeNull();
    expect(screen.getByRole("link", { name: LOGIN_LINK })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("still renders the loan history", () => {
    setHook({ history: [historyEntry] });
    setMember(null);

    renderPage();

    expect(screen.getByRole("heading", { name: HISTORY_HEADING })).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });
});

describe("GameDetailPage borrower visibility", () => {
  it("hides borrower name and shows the no-name 'Prestado' badge when payload omits the name (anonymous)", () => {
    setHook({
      game: { ...game, status: "lent", borrower_display_name: null, loan_id: null },
    });
    setMember(null);

    renderPage();

    expect(screen.getByText("Prestado")).toBeInTheDocument();
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
});

describe("GameDetailPage return CTA", () => {
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

    expect(screen.getByRole("button", { name: RETURN_CTA })).toBeInTheDocument();
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

    expect(screen.getByRole("button", { name: RETURN_CTA })).toBeInTheDocument();
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

    expect(screen.queryByRole("button", { name: RETURN_CTA })).toBeNull();
  });
});

describe("GameDetailPage history section", () => {
  it("renders history entries for an available game", () => {
    setHook({ history: [historyEntry] });
    setMember(member);

    renderPage();

    expect(screen.getByRole("heading", { name: HISTORY_HEADING })).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("renders history entries for a lent game", () => {
    setHook({
      game: { ...game, status: "lent", borrower_display_name: null, loan_id: 7 },
      history: [historyEntry],
    });
    setMember(null);

    renderPage();

    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("shows the empty-history message when the game was never lent", () => {
    setHook();
    setMember(member);

    renderPage();

    expect(
      screen.getByText("Este juego nunca ha sido prestado."),
    ).toBeInTheDocument();
  });
});
