import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminBggPage } from "./AdminBggPage";

const useAuthMock = vi.fn();
const apiFetchMock = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("../api/client", () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

const ADMIN = {
  id: 1,
  display_name: "Admin User",
  email: "admin@example.invalid",
  is_admin: true,
};

const COMBINED_SUCCESS = {
  boardgames: {
    result: {
      created: 2,
      updated: 3,
      deleted: 4,
      deactivated: 5,
      total: 14,
      skip_reason: null,
    },
    error: null,
  },
  rpg_items: {
    result: {
      created: 7,
      updated: 8,
      deleted: 9,
      deactivated: 10,
      total: 34,
      skip_reason: null,
    },
    error: null,
  },
  last_imported_at: "2026-07-15T10:00:00Z",
};

const BOARDGAME_SKIP_WARNING =
  "Se ha omitido la retirada de juegos de mesa por seguridad.";

const PARTIAL_FAILURE = {
  boardgames: {
    result: {
      created: 1,
      updated: 2,
      deleted: 0,
      deactivated: 3,
      total: 6,
      skip_reason: BOARDGAME_SKIP_WARNING,
    },
    error: null,
  },
  rpg_items: {
    result: null,
    error: "No se han podido sincronizar los juegos de rol.",
  },
  last_imported_at: "2026-07-15T11:00:00Z",
};

const STAT_LABELS = {
  created: "Nuevos",
  updated: "Actualizados",
  deleted: "Eliminados",
  deactivated: "Ocultados",
  total: "Total",
} as const;

function expectCatalogCounters(
  catalogName: string,
  counters: Readonly<Record<keyof typeof STAT_LABELS, number>>,
): void {
  const catalog = screen.getByRole("region", { name: catalogName });

  Object.entries(STAT_LABELS).forEach(([key, label]) => {
    const stat = within(catalog).getByText(label).closest(".admin-bgg-stat");
    expect(stat).toHaveTextContent(
      new RegExp(`${label}\\s*${counters[key as keyof typeof STAT_LABELS]}`),
    );
  });
}

async function startImport(): Promise<void> {
  await waitFor(() => {
    expect(apiFetchMock).toHaveBeenCalledWith("/admin/bgg/status");
  });

  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", { name: "Reimportar desde BGG" }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthMock.mockReturnValue({ member: ADMIN, loading: false });
  apiFetchMock.mockResolvedValueOnce({ last_imported_at: null });
});

describe("AdminBggPage catalog synchronization outcomes", () => {
  it("renders separate concrete counters for successful board-game and RPG imports", async () => {
    apiFetchMock.mockResolvedValueOnce(COMBINED_SUCCESS);
    render(<AdminBggPage />);

    await startImport();

    await screen.findByRole("region", { name: "Juegos de mesa" });
    expect(
      screen.getByRole("heading", { name: "Juegos de mesa" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Juegos de rol" }),
    ).toBeInTheDocument();
    expectCatalogCounters("Juegos de mesa", {
      created: 2,
      updated: 3,
      deleted: 4,
      deactivated: 5,
      total: 14,
    });
    expectCatalogCounters("Juegos de rol", {
      created: 7,
      updated: 8,
      deleted: 9,
      deactivated: 10,
      total: 34,
    });
    expect(apiFetchMock).toHaveBeenNthCalledWith(2, "/admin/bgg/import", {
      method: "POST",
    });
  });

  it("keeps a board-game success and its warning visible beside an RPG failure", async () => {
    apiFetchMock.mockResolvedValueOnce(PARTIAL_FAILURE);
    render(<AdminBggPage />);

    await startImport();

    await screen.findByRole("region", { name: "Juegos de mesa" });
    expectCatalogCounters("Juegos de mesa", {
      created: 1,
      updated: 2,
      deleted: 0,
      deactivated: 3,
      total: 6,
    });
    expect(screen.getByText(BOARDGAME_SKIP_WARNING)).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Juegos de rol" })).getByText(
        "No se han podido sincronizar los juegos de rol.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No se ha podido reimportar desde BGG."),
    ).toBeNull();
  });
});
