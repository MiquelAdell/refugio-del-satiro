import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RpgDetailPage } from "./RpgDetailPage";
import type { RpgItem } from "../types/rpg";
import type { LoanHistoryEntry } from "../types/loan";
import type { CurrentMember } from "../types/member";

const refetch = vi.fn();
const useRpgHistoryMock = vi.fn();
const useAuthMock = vi.fn();
const apiFetchMock = vi.fn();

vi.mock("../hooks/useRpgHistory", () => ({
  useRpgHistory: () => useRpgHistoryMock(),
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

const item: RpgItem = {
  id: 5,
  bgg_id: 200,
  name: "Dungeons & Dragons",
  slug: "dungeons-dragons",
  thumbnail_url: "https://example.com/dnd-thumb.jpg",
  image_url: "https://example.com/dnd-large.jpg",
  year_published: 1974,
  bgg_rating: 8.5,
  description: "The original tabletop RPG.",
  description_es: "",
  categories: ["Fantasy", "Mythology"],
  publication_types: ["Core Rules", "Sourcebook"],
  status: "available",
  loan_id: null,
  borrower_display_name: null,
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
    item: RpgItem | null;
    history: readonly LoanHistoryEntry[];
    loading: boolean;
    error: string | null;
  }> = {},
) {
  useRpgHistoryMock.mockReturnValue({
    item,
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
    <MemoryRouter initialEntries={["/rol/dungeons-dragons"]}>
      <Routes>
        <Route path="/rol/:slug" element={<RpgDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RpgDetailPage loading state", () => {
  it("shows loading message while fetching", () => {
    useRpgHistoryMock.mockReturnValue({
      item: null,
      history: [],
      loading: true,
      error: null,
      refetch,
    });
    useAuthMock.mockReturnValue({ member: null, loading: false });

    renderPage();

    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });
});

describe("RpgDetailPage borrow CTA", () => {
  beforeEach(() => {
    refetch.mockReset();
    apiFetchMock.mockReset();
    apiFetchMock.mockResolvedValue({});
  });

  it("shows the borrow CTA for an available item with a logged-in member", () => {
    setHook();
    setMember(member);

    renderPage();

    expect(
      screen.getByRole("button", { name: BORROW_CTA }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: RETURN_CTA })).toBeNull();
  });

  it("shows the 'Prestado' status instead of the CTA for a lent item when logged out", () => {
    setHook({
      item: {
        ...item,
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

  it("calls POST /loans with game_id and refetches after confirming a borrow", async () => {
    setHook();
    setMember(member);

    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: BORROW_CTA }));
    const buttons = screen.getAllByRole("button", { name: BORROW_CTA });
    await user.click(buttons[buttons.length - 1]);

    expect(apiFetchMock).toHaveBeenCalledWith("/loans", {
      method: "POST",
      body: JSON.stringify({ game_id: 5 }),
    });
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});

describe("RpgDetailPage anonymous mode", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it("shows a login link for anonymous user viewing an available item", () => {
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

describe("RpgDetailPage borrower visibility", () => {
  it("shows no-name 'Prestado' badge when payload omits the name", () => {
    setHook({
      item: {
        ...item,
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
      item: {
        ...item,
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

describe("RpgDetailPage return CTA", () => {
  it("shows the return CTA to the borrower of a lent item", () => {
    setHook({
      item: {
        ...item,
        status: "lent",
        borrower_display_name: member.display_name,
        loan_id: 7,
      },
    });
    setMember(member);

    renderPage();

    expect(
      screen.getByRole("button", { name: RETURN_CTA }),
    ).toBeInTheDocument();
  });

  it("shows the return CTA to an admin even when the loan is someone else's", () => {
    setHook({
      item: {
        ...item,
        status: "lent",
        borrower_display_name: "Bob Jones",
        loan_id: 7,
      },
    });
    setMember(admin);

    renderPage();

    expect(
      screen.getByRole("button", { name: RETURN_CTA }),
    ).toBeInTheDocument();
  });

  it("hides the return CTA from a non-admin who is not the borrower", () => {
    setHook({
      item: {
        ...item,
        status: "lent",
        borrower_display_name: "Bob Jones",
        loan_id: 7,
      },
    });
    setMember(member);

    renderPage();

    expect(screen.queryByRole("button", { name: RETURN_CTA })).toBeNull();
  });

  it("calls PATCH /loans/{loan_id}/return and refetches after confirming return", async () => {
    refetch.mockReset();
    apiFetchMock.mockReset();
    apiFetchMock.mockResolvedValue({});

    setHook({
      item: {
        ...item,
        status: "lent",
        borrower_display_name: member.display_name,
        loan_id: 7,
      },
    });
    setMember(member);

    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: RETURN_CTA }));
    const buttons = screen.getAllByRole("button", { name: RETURN_CTA });
    await user.click(buttons[buttons.length - 1]);

    expect(apiFetchMock).toHaveBeenCalledWith("/loans/7/return", {
      method: "PATCH",
    });
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});

describe("RpgDetailPage history section", () => {
  it("renders history entries", () => {
    setHook({ history: [historyEntry] });
    setMember(member);

    renderPage();

    expect(
      screen.getByRole("heading", { name: HISTORY_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("shows the empty-history message when the item was never lent", () => {
    setHook();
    setMember(member);

    renderPage();

    expect(
      screen.getByText("Este libro nunca ha sido prestado."),
    ).toBeInTheDocument();
  });
});

describe("RpgDetailPage content", () => {
  it("renders title, year, and RPGGeek link", () => {
    setHook();
    setMember(null);

    renderPage();

    expect(
      screen.getByRole("heading", { name: "Dungeons & Dragons" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1974")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver en RPGGeek" }),
    ).toHaveAttribute("href", "https://rpggeek.com/rpgitem/200");
  });

  it("renders the back link to the catalog", () => {
    setHook();
    setMember(null);

    renderPage();

    expect(
      screen.getByRole("link", { name: /Volver al catálogo/i }),
    ).toHaveAttribute("href", "/juegos-de-rol");
  });

  it("renders the exact description, categories, and publication types", () => {
    setHook();
    setMember(null);

    renderPage();

    expect(screen.getByText("Categorías")).toBeInTheDocument();
    expect(screen.getByText("Fantasy, Mythology")).toBeInTheDocument();
    expect(screen.getByText("Tipo de publicación")).toBeInTheDocument();
    expect(screen.getByText("Core Rules, Sourcebook")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Descripción" }),
    ).toHaveTextContent("The original tabletop RPG.");
  });

  it("omits classification and description groups when metadata is empty", () => {
    setHook({
      item: {
        ...item,
        description: "",
        categories: [],
        publication_types: [],
      },
    });
    setMember(null);

    renderPage();

    expect(screen.queryByText("Categorías")).toBeNull();
    expect(screen.queryByText("Tipo de publicación")).toBeNull();
    expect(screen.queryByRole("region", { name: "Descripción" })).toBeNull();
  });
});
