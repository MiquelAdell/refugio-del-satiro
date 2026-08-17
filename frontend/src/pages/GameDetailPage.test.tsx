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
const useMyLoansMock = vi.fn();
const useAuthMock = vi.fn();
const apiFetchMock = vi.fn();
const refetchMyLoans = vi.fn();

vi.mock("../hooks/useGameHistory", () => ({
  useGameHistory: () => useGameHistoryMock(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("../hooks/useMyLoans", () => ({
  useMyLoans: (...args: unknown[]) => useMyLoansMock(...args),
}));

vi.mock("../api/client", () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

const BORROW_CTA = "Solicitar préstamo";
const RETURN_CTA = "Devolver";
const FORCE_RETURN_CTA = "Forzar devolución";
const BORROW_SUCCESS_MESSAGE =
  "El préstamo no tiene fecha límite, pero haz un uso responsable: devuélvelo cuando hayas jugado o si finalmente no vas a usarlo.";
const FORCED_RETURN_SUCCESS_MESSAGE =
  "Devolución forzada. Se ha avisado por correo a la persona que tenía el préstamo.";
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
  min_age: 10,
  bgg_rating: 7.2,
  location: "armario",
  description:
    "Trade and build across the island.\n\nEvery route changes the table.",
  description_es: "",
  categories: ["Economic", "Negotiation"],
  primary_tag: "familygames",
  status: "available",
  borrower_display_name: null,
  loan_id: null,
};

const member: CurrentMember = {
  id: 42,
  member_number: 42,
  first_name: "Alice",
  last_name: "Smith",
  nickname: "Ali",
  phone: "600 111 222",
  display_name: "Alice Smith",
  email: "alice@example.com",
  is_admin: false,
  is_active: true,
  last_payment: "1/03/2026",
};

const admin: CurrentMember = {
  id: 99,
  member_number: 99,
  first_name: "Admin",
  last_name: "User",
  nickname: null,
  phone: null,
  display_name: "Admin User",
  email: "admin@example.com",
  is_admin: true,
  is_active: true,
  last_payment: null,
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

function setMyLoans(loanIds: readonly number[]) {
  useMyLoansMock.mockReturnValue({
    loans: loanIds.map((loan_id) => ({ loan_id })),
    loading: false,
    error: null,
    refetch: refetchMyLoans,
  });
}

beforeEach(() => {
  refetchMyLoans.mockReset();
  setMyLoans([]);
});

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

async function confirmReturn(label: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: label }));
  const buttons = screen.getAllByRole("button", { name: label });
  await user.click(buttons[buttons.length - 1]);
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

    expect(
      screen.getByRole("button", { name: BORROW_CTA }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: RETURN_CTA })).toBeNull();
  });

  it("shows the non-actionable 'Prestado' status instead of the CTA for a lent game", () => {
    setHook({
      game: {
        ...game,
        status: "lent",
        borrower_display_name: null,
        loan_id: null,
      },
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
    expect(refetchMyLoans).toHaveBeenCalledTimes(1);
    const feedback = await screen.findByRole("status");
    expect(feedback).toHaveTextContent(BORROW_SUCCESS_MESSAGE);
    expect(feedback).toHaveAttribute("aria-live", "polite");
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

    expect(
      screen.getByRole("heading", { name: HISTORY_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });
});

describe("GameDetailPage borrower visibility", () => {
  it("hides borrower name and shows the no-name 'Prestado' badge when payload omits the name (anonymous)", () => {
    setHook({
      game: {
        ...game,
        status: "lent",
        borrower_display_name: null,
        loan_id: null,
      },
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
    setMyLoans([7]);

    renderPage();

    expect(screen.getByText("Prestado a Bob Jones")).toBeInTheDocument();
  });
});

describe("GameDetailPage return CTA", () => {
  beforeEach(() => {
    refetch.mockReset();
    apiFetchMock.mockReset();
    apiFetchMock.mockResolvedValue({ forced_return_email_sent: null });
  });

  it("labels the trigger and confirmation 'Devolver' for the borrower", async () => {
    setHook({
      game: {
        ...game,
        status: "lent",
        borrower_display_name: member.display_name,
        loan_id: 7,
      },
    });
    setMember(member);
    setMyLoans([7]);

    renderPage();
    const user = userEvent.setup();

    expect(
      screen.getByRole("button", { name: RETURN_CTA }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: RETURN_CTA }));

    expect(
      screen.getByRole("button", { name: RETURN_CTA }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: FORCE_RETURN_CTA })).toBeNull();
  });

  it("labels the trigger and confirmation 'Forzar devolución' for an admin returning another member's loan", async () => {
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
    const user = userEvent.setup();

    expect(
      screen.getByRole("button", { name: FORCE_RETURN_CTA }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: FORCE_RETURN_CTA }));

    expect(
      screen.getByRole("button", { name: FORCE_RETURN_CTA }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: RETURN_CTA })).toBeNull();
  });

  it("keeps 'Devolver' for an admin returning their own loan", () => {
    setHook({
      game: {
        ...game,
        status: "lent",
        borrower_display_name: admin.display_name,
        loan_id: 7,
      },
    });
    setMember(admin);
    setMyLoans([7]);

    renderPage();

    expect(
      screen.getByRole("button", { name: RETURN_CTA }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: FORCE_RETURN_CTA })).toBeNull();
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
    expect(screen.queryByRole("button", { name: FORCE_RETURN_CTA })).toBeNull();
  });

  it("does not infer ownership from a duplicate display name", () => {
    setHook({
      game: {
        ...game,
        status: "lent",
        borrower_display_name: member.display_name,
        loan_id: 7,
      },
    });
    setMember(member);
    setMyLoans([]);

    renderPage();

    expect(screen.queryByRole("button", { name: RETURN_CTA })).toBeNull();
    expect(screen.queryByRole("button", { name: FORCE_RETURN_CTA })).toBeNull();
  });

  it("shows a polite status when a forced-return email is sent", async () => {
    apiFetchMock.mockResolvedValue({ forced_return_email_sent: true });
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
    await confirmReturn(FORCE_RETURN_CTA);

    const feedback = await screen.findByRole("status");
    expect(feedback).toHaveTextContent(FORCED_RETURN_SUCCESS_MESSAGE);
    expect(feedback).toHaveAttribute("aria-live", "polite");
  });
});

describe("GameDetailPage history section", () => {
  it("renders history entries for an available game", () => {
    setHook({ history: [historyEntry] });
    setMember(member);

    renderPage();

    expect(
      screen.getByRole("heading", { name: HISTORY_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("renders history entries for a lent game", () => {
    setHook({
      game: {
        ...game,
        status: "lent",
        borrower_display_name: null,
        loan_id: 7,
      },
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

describe("GameDetailPage catalog metadata", () => {
  it("renders the exact categories and description paragraphs", () => {
    setHook();
    setMember(null);

    renderPage();

    expect(screen.getByText("Categorías")).toBeInTheDocument();
    expect(screen.getByText("Economic, Negotiation")).toBeInTheDocument();
    const description = screen.getByRole("region", { name: "Descripción" });
    expect(description).toHaveTextContent("Trade and build across the island.");
    expect(description).toHaveTextContent("Every route changes the table.");
  });

  it("omits category and description groups when metadata is empty", () => {
    setHook({
      game: { ...game, description: "", categories: [] },
    });
    setMember(null);

    renderPage();

    expect(screen.queryByText("Categorías")).toBeNull();
    expect(screen.queryByRole("region", { name: "Descripción" })).toBeNull();
  });
});
