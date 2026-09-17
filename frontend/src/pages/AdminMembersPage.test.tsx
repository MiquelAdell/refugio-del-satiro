import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminMembersPage } from "./AdminMembersPage";
import type { AdminMember, ImportMembersResponse } from "../types/admin";
import type { GameWithStatus } from "../types/game";
import type { RpgItem } from "../types/rpg";

const useAuthMock = vi.fn();
const apiFetchMock = vi.fn();
const apiUploadMock = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("../api/client", () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
  apiUpload: (...args: unknown[]) => apiUploadMock(...args),
}));

const IMPORT_PATH = "/admin/members/import";
const MEMBERS_PATH = "/admin/members";
const FILE_INPUT_LABEL = "Seleccionar archivo CSV de socios";

const successfulImport: ImportMembersResponse = {
  created: [
    {
      display_name: "Carla García",
      email: "carla@example.invalid",
      token_url: "https://example.invalid/access/carla-token",
    },
  ],
  created_count: 1,
  updated_count: 2,
  disabled_count: 4,
  total_rows: 6,
  skipped_rows: 3,
  deactivation_skip_reason: null,
};

const guardedImport: ImportMembersResponse = {
  created: [],
  created_count: 0,
  updated_count: 1,
  disabled_count: 0,
  total_rows: 2,
  skipped_rows: 1,
  deactivation_skip_reason:
    "No se desactivaron socios porque el archivo contiene muy pocos registros.",
};

const roleMembers: readonly AdminMember[] = [
  {
    id: 1,
    member_number: 10,
    first_name: "Alex",
    last_name: "Socio",
    nickname: null,
    display_name: "Alex Socio",
    email: "alex@example.invalid",
    phone: null,
    is_admin: false,
    is_active: true,
    active_loan_count: 0,
  },
  {
    id: 2,
    member_number: 20,
    first_name: "Nora",
    last_name: "Admin",
    nickname: null,
    display_name: "Nora Admin",
    email: "nora@example.invalid",
    phone: null,
    is_admin: true,
    is_active: true,
    active_loan_count: 1,
  },
];

const loanGames: readonly GameWithStatus[] = [
  {
    id: 10, bgg_id: 100, name: "Cascadia", slug: "cascadia",
    thumbnail_url: "", image_url: "", year_published: 2021,
    min_players: 1, max_players: 4, playing_time: 45, min_age: 10,
    bgg_rating: 7.8, location: "Armario", description: "", description_es: "",
    categories: ["Acción y destreza"], primary_tag: "Familiar",
    status: "available", borrower_display_name: null, loan_id: null,
  },
  {
    id: 11, bgg_id: 101, name: "Juego prestado", slug: "juego-prestado",
    thumbnail_url: "", image_url: "", year_published: 2020,
    min_players: 2, max_players: 4, playing_time: 30, min_age: 8,
    bgg_rating: 7.1, location: "Sótano", description: "", description_es: "",
    categories: ["Familiar"], primary_tag: "Cartas",
    status: "lent", borrower_display_name: "Nora Admin", loan_id: 2,
  },
];

const loanRpgItems: readonly RpgItem[] = [
  {
    id: 12, bgg_id: 102, name: "La llamada de Cthulhu", slug: "llamada-cthulhu",
    thumbnail_url: "", image_url: "", year_published: 2020, bgg_rating: 8.2,
    description: "", description_es: "", categories: ["Horror"],
    publication_types: ["Manual"], status: "available",
    borrower_display_name: null, loan_id: null,
  },
];

function renderPage() {
  return render(<AdminMembersPage />);
}

async function uploadCsv(contents = "Email\ncarla@example.invalid") {
  const user = userEvent.setup();
  const file = new File([contents], "socios.csv", { type: "text/csv" });

  await user.upload(screen.getByLabelText(FILE_INPUT_LABEL), file);

  return file;
}

describe("AdminMembersPage CSV reconciliation", () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    apiFetchMock.mockReset();
    apiUploadMock.mockReset();
    useAuthMock.mockReturnValue({
      member: {
        id: 99,
        display_name: "Admin User",
        email: "admin@example.invalid",
        is_admin: true,
      },
      loading: false,
    });
    apiFetchMock.mockResolvedValue([]);
  });

  it("shows all reconciliation counts and created-member token links after disabling absent members", async () => {
    apiUploadMock.mockResolvedValue(successfulImport);
    renderPage();
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    const file = await uploadCsv();

    expect(
      await screen.findByText(
        "Importación completada. Creados: 1. Actualizados: 2. Filas omitidas: 3 de 6. Desactivados: 4.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Carla García")).toBeInTheDocument();
    expect(
      screen.getByText("https://example.invalid/access/carla-token"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(apiUploadMock).toHaveBeenCalledTimes(1);
    expect(apiUploadMock).toHaveBeenCalledWith(
      IMPORT_PATH,
      expect.any(FormData),
    );

    const uploadedForm = apiUploadMock.mock.calls[0][1] as FormData;
    expect(uploadedForm.get("file")).toBe(file);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(2));
    expect(apiFetchMock).toHaveBeenNthCalledWith(1, MEMBERS_PATH);
    expect(apiFetchMock).toHaveBeenNthCalledWith(2, MEMBERS_PATH);
  });

  it("shows the server safety warning when guarded deactivation creates no members", async () => {
    apiUploadMock.mockResolvedValue(guardedImport);
    renderPage();
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    const file = await uploadCsv("Email\nexisting@example.invalid");

    expect(
      await screen.findByText(
        "Importación completada. Creados: 0. Actualizados: 1. Filas omitidas: 1 de 2. Desactivados: 0.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Aviso de seguridad: No se desactivaron socios porque el archivo contiene muy pocos registros.",
    );
    expect(
      screen.queryByText(
        /Ningún socio nuevo \(socios existentes actualizados\)/,
      ),
    ).toBeNull();
    expect(apiUploadMock).toHaveBeenCalledTimes(1);
    expect(apiUploadMock).toHaveBeenCalledWith(
      IMPORT_PATH,
      expect.any(FormData),
    );

    const uploadedForm = apiUploadMock.mock.calls[0][1] as FormData;
    expect(uploadedForm.get("file")).toBe(file);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(2));
  });
});

describe("AdminMembersPage member roles", () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    apiFetchMock.mockReset();
    apiUploadMock.mockReset();
    useAuthMock.mockReturnValue({
      member: {
        id: 99,
        display_name: "Admin User",
        email: "admin@example.invalid",
        is_admin: true,
      },
      loading: false,
    });
    apiFetchMock.mockResolvedValue(roleMembers);
  });

  it("renders each explicit role label in its member row as accessible cell text", async () => {
    renderPage();

    const adminRow = await screen.findByRole("row", { name: /Nora Admin/ });
    const memberRow = screen.getByRole("row", { name: /Alex Socio/ });

    expect(
      within(adminRow).getByRole("cell", { name: "Administrador" }),
    ).toHaveTextContent("Administrador");
    expect(
      within(memberRow).getByRole("cell", { name: "Socio" }),
    ).toHaveTextContent("Socio");
  });

  it("sorts roles in both directions from the accessible Rol header", async () => {
    const user = userEvent.setup();
    renderPage();

    const roleButton = await screen.findByRole("button", { name: "Rol" });
    const roleHeader = screen.getByRole("columnheader", { name: "Rol" });

    await user.click(roleButton);

    expect(roleHeader).toHaveAttribute("aria-sort", "ascending");
    expect(
      screen
        .getAllByRole("row")
        .slice(1)
        .map((row) => within(row).getAllByRole("cell")[0]?.textContent),
    ).toEqual(["Nora Admin", "Alex Socio"]);

    await user.click(roleButton);

    expect(roleHeader).toHaveAttribute("aria-sort", "descending");
    expect(
      screen
        .getAllByRole("row")
        .slice(1)
        .map((row) => within(row).getAllByRole("cell")[0]?.textContent),
    ).toEqual(["Alex Socio", "Nora Admin"]);
  });
});

describe("AdminMembersPage admin-created loans", () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    apiFetchMock.mockReset();
    apiUploadMock.mockReset();
    useAuthMock.mockReturnValue({
      member: {
        id: 99,
        display_name: "Admin User",
        email: "admin@example.invalid",
        is_admin: true,
      },
      loading: false,
    });
    apiFetchMock.mockImplementation((path: string) => {
      if (path === "/admin/members") return Promise.resolve(roleMembers);
      if (path === "/juegos") return Promise.resolve(loanGames);
      if (path === "/rol") return Promise.resolve(loanRpgItems);
      if (path === "/admin/loans") return Promise.resolve({});
      return Promise.reject(new Error("Unexpected path"));
    });
  });

  it("creates a loan after searching an available item by supported metadata", async () => {
    const user = userEvent.setup();
    renderPage();

    const memberRow = await screen.findByRole("row", { name: /Alex Socio/ });
    await user.click(
      within(memberRow).getByRole("button", { name: "Crear préstamo" }),
    );

    const search = await screen.findByRole("searchbox", {
      name: "Buscar juego",
    });
    expect(await screen.findByText("La llamada de Cthulhu")).toBeInTheDocument();
    expect(screen.getByText("Juego de rol · Manual")).toBeInTheDocument();

    await user.type(search, "accion");

    expect(screen.queryByText("Cascadia")).toBeNull();

    await user.clear(search);
    await user.type(search, "armario");

    expect(await screen.findByText("Cascadia")).toBeInTheDocument();
    expect(screen.queryByText("Juego prestado")).toBeNull();

    await user.click(screen.getByRole("button", { name: /Cascadia/ }));
    await user.click(
      screen.getByRole("button", { name: /^Crear préstamo$/ }),
    );

    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith("/admin/loans", {
        method: "POST",
        body: JSON.stringify({ game_id: 10, member_id: 1 }),
      }),
    );
    expect(
      await screen.findByText("Préstamo creado para Alex Socio."),
    ).toBeInTheDocument();
  });

  it("does not offer loan creation for inactive members", async () => {
    apiFetchMock.mockImplementation((path: string) =>
      Promise.resolve(
        path === "/admin/members"
          ? [
              ...roleMembers,
              {
                ...roleMembers[0],
                id: 3,
                display_name: "Inés Inactiva",
                is_active: false,
              },
            ]
          : loanGames,
      ),
    );
    renderPage();

    const inactiveRow = await screen.findByRole("row", {
      name: /Inés Inactiva/,
    });
    expect(
      within(inactiveRow).queryByRole("button", { name: "Crear préstamo" }),
    ).toBeNull();
  });
});
