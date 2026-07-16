import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CurrentMember } from "../types/member";
import { ProfilePage } from "./ProfilePage";

const useAuthMock = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

const MEMBER: CurrentMember = {
  id: 901,
  member_number: 27,
  first_name: "Ana",
  last_name: "García López",
  nickname: "Anita",
  phone: "600 123 456",
  email: "ana@example.invalid",
  display_name: "Anita",
  is_admin: false,
  is_active: true,
  last_payment: "1/03/2026",
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/profile"]}>
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<h1>Inicio de sesión</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthMock.mockReturnValue({ member: MEMBER, loading: false });
});

describe("ProfilePage authentication states", () => {
  it("shows Spanish loading copy while authentication is loading", () => {
    useAuthMock.mockReturnValue({ member: null, loading: true });

    renderPage();

    expect(
      screen.getByRole("heading", { name: "Mi perfil" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Cargando perfil...")).toBeInTheDocument();
  });

  it("redirects a guest to login", () => {
    useAuthMock.mockReturnValue({ member: null, loading: false });

    renderPage();

    expect(
      screen.getByRole("heading", { name: "Inicio de sesión" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Mi perfil" })).toBeNull();
  });
});

describe("ProfilePage member information", () => {
  it("renders every requested label and exact non-null value", () => {
    renderPage();

    expect(screen.getByText("Número de socio")).toBeInTheDocument();
    expect(screen.getByText("27")).toBeInTheDocument();
    expect(screen.getByText("Nombre")).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Apellidos")).toBeInTheDocument();
    expect(screen.getByText("García López")).toBeInTheDocument();
    expect(screen.getByText("Apodo")).toBeInTheDocument();
    expect(screen.getByText("Anita")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "ana@example.invalid" }),
    ).toHaveAttribute("href", "mailto:ana@example.invalid");
    expect(screen.getByText("Teléfono")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "600 123 456" })).toHaveAttribute(
      "href",
      "tel:600 123 456",
    );
    expect(screen.getByText("Estado de membresía")).toBeInTheDocument();
    expect(screen.getAllByText("Activo")).toHaveLength(2);
    expect(screen.getByText("Última cuota")).toBeInTheDocument();
    expect(screen.getByText("1/03/2026")).toBeInTheDocument();
  });

  it("renders concrete fallbacks for every nullable value", () => {
    useAuthMock.mockReturnValue({
      member: {
        ...MEMBER,
        member_number: null,
        nickname: null,
        phone: null,
        last_payment: null,
      },
      loading: false,
    });

    renderPage();

    expect(screen.getAllByText("No disponible")).toHaveLength(4);
  });

  it("renders inactive membership status in text", () => {
    useAuthMock.mockReturnValue({
      member: { ...MEMBER, is_active: false },
      loading: false,
    });

    renderPage();

    expect(screen.getAllByText("Inactivo")).toHaveLength(2);
    expect(screen.queryByText("Activo")).toBeNull();
  });
});

describe("ProfilePage navigation and read-only boundary", () => {
  it("links to loans and password change", () => {
    renderPage();

    expect(screen.getByRole("link", { name: "Mis préstamos" })).toHaveAttribute(
      "href",
      "/my-loans",
    );
    expect(
      screen.getByRole("link", { name: "Cambiar contraseña" }),
    ).toHaveAttribute("href", "/change-password");
  });

  it("does not render editing or saving controls", () => {
    renderPage();

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByText(/Editar|Guardar/i)).toBeNull();
  });
});
