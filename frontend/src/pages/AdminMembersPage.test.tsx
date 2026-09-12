import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminMembersPage } from "./AdminMembersPage";
import type { AdminMember, ImportMembersResponse } from "../types/admin";

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
