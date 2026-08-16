import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "./LoginPage";

const LOGIN_ERROR = "Correo o contraseña incorrectos.";
const mockLogin = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin }),
}));

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    mockLogin.mockReset();
  });

  it("shows privacy-safe membership guidance after failed login", async () => {
    mockLogin.mockRejectedValue(new Error(LOGIN_ERROR));
    renderLoginPage();

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "unknown@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "incorrect-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(LOGIN_ERROR);
    expect(alert).toHaveTextContent(
      "El área privada de préstamos está disponible únicamente para socios y socias al corriente de pago."
    );
    expect(
      screen.getByRole("link", { name: "hacerte socio o socia" })
    ).toHaveAttribute("href", "/socios");
    expect(mockLogin).toHaveBeenCalledExactlyOnceWith(
      "unknown@example.com",
      "incorrect-password"
    );
  });
});
