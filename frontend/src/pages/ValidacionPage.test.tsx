import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidacionPage } from "./ValidacionPage";

// ── Mock apiFetch ─────────────────────────────────────────────────────────────

vi.mock("../api/client", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "../api/client";
const mockApiFetch = vi.mocked(apiFetch);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ACTIVE_MEMBER = {
  member_number: 5,
  first_name: "Ana",
  last_name: "García López",
  active: true,
  last_payment: "1/03/2025",
  gender_label: "socia" as const,
};

const INACTIVE_MEMBER = {
  member_number: 1,
  first_name: "Dani",
  last_name: "Aguilar Vélez",
  active: false,
  last_payment: "5/02/2022",
  gender_label: "socio" as const,
};

const MEMBER_NO_PAYMENT = {
  member_number: 3,
  first_name: "Alex",
  last_name: "Martínez",
  active: true,
  last_payment: null,
  gender_label: "socio/a" as const,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPage(search = "") {
  return render(
    <MemoryRouter initialEntries={[`/validacion${search}`]}>
      <ValidacionPage />
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ValidacionPage — idle state", () => {
  it("renders the page title", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /validar membresía/i
    );
  });

  it("renders the intro text", () => {
    renderPage();
    expect(
      screen.getByText(
        /Introduce el número de socio en el siguiente campo para validar la membresía del socio o socia./
      )
    ).toBeInTheDocument();
  });

  it("renders the search input with correct placeholder", () => {
    renderPage();
    expect(
      screen.getByPlaceholderText("Buscar socio/a por número...")
    ).toBeInTheDocument();
  });

  it("renders the Buscar button as disabled when input is empty", () => {
    renderPage();
    expect(screen.getByRole("button", { name: "Buscar" })).toBeDisabled();
  });

  it("renders both disclaimer paragraphs", () => {
    renderPage();
    expect(
      screen.getByText(/duración mínima de 1 año natural/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/acceso libre a la ludoteca del club/)
    ).toBeInTheDocument();
  });

  it("does not render a result section initially", () => {
    renderPage();
    expect(
      screen.queryByRole("region", { name: "Resultado de validación" })
    ).toBeNull();
  });
});

describe("ValidacionPage — found state (active member)", () => {
  it("shows the member name, active verdict, and last payment", async () => {
    mockApiFetch.mockResolvedValueOnce(ACTIVE_MEMBER);
    renderPage();

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("Buscar socio/a por número..."), "5");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => {
      expect(screen.getByText(/ANA GARCÍA LÓPEZ #5/i)).toBeInTheDocument();
    });

    expect(screen.getByText("ES SOCIA")).toBeInTheDocument();
    expect(screen.getByText("ÚLTIMA CUOTA PAGADA:")).toBeInTheDocument();
    expect(screen.getByText("1/03/2025")).toBeInTheDocument();
  });
});

describe("ValidacionPage — found state (inactive member)", () => {
  it("shows the member name, inactive verdict, and last payment", async () => {
    mockApiFetch.mockResolvedValueOnce(INACTIVE_MEMBER);
    renderPage();

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("Buscar socio/a por número..."), "1");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => {
      expect(screen.getByText(/DANI AGUILAR VÉLEZ #1/i)).toBeInTheDocument();
    });

    expect(screen.getByText("NO ES SOCIO")).toBeInTheDocument();
    expect(screen.getByText("5/02/2022")).toBeInTheDocument();
  });
});

describe("ValidacionPage — found state (no last_payment)", () => {
  it("hides the payment block when last_payment is null", async () => {
    mockApiFetch.mockResolvedValueOnce(MEMBER_NO_PAYMENT);
    renderPage();

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("Buscar socio/a por número..."), "3");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => {
      expect(screen.getByText(/ALEX MARTÍNEZ #3/i)).toBeInTheDocument();
    });

    expect(screen.queryByText("ÚLTIMA CUOTA PAGADA:")).toBeNull();
  });
});

describe("ValidacionPage — not-found state", () => {
  it("shows the not-found message with the searched number", async () => {
    mockApiFetch.mockRejectedValueOnce(new Error("Error 404"));
    renderPage();

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("Buscar socio/a por número..."), "99");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => {
      expect(
        screen.getByText(/No se ha encontrado al socio o socia con número/)
      ).toBeInTheDocument();
    });

    expect(screen.getByText("99")).toBeInTheDocument();
  });
});

describe("ValidacionPage — error state", () => {
  it("shows a generic error message on network failure", async () => {
    mockApiFetch.mockRejectedValueOnce(new Error("Error de red"));
    renderPage();

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("Buscar socio/a por número..."), "5");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Error de red");
    });
  });
});

describe("ValidacionPage — clear button", () => {
  it("shows the clear button when input has a value and clears on click", async () => {
    renderPage();
    const user = userEvent.setup();
    const input = screen.getByPlaceholderText("Buscar socio/a por número...");

    await user.type(input, "5");
    const clearBtn = screen.getByRole("button", { name: "Limpiar búsqueda" });
    expect(clearBtn).toBeInTheDocument();

    await user.click(clearBtn);
    expect(input).toHaveValue("");
    expect(screen.queryByRole("button", { name: "Limpiar búsqueda" })).toBeNull();
  });
});

describe("ValidacionPage — ?id= query param", () => {
  it("prefills the input and auto-searches when ?id is present", async () => {
    mockApiFetch.mockResolvedValueOnce(ACTIVE_MEMBER);
    renderPage("?id=5");

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/members/validate?number=5"
      );
    });

    expect(screen.getByPlaceholderText("Buscar socio/a por número...")).toHaveValue("5");

    await waitFor(() => {
      expect(screen.getByText(/ANA GARCÍA LÓPEZ #5/i)).toBeInTheDocument();
    });
  });
});

describe("ValidacionPage — submit button state", () => {
  it("enables the Buscar button when input has a value", async () => {
    renderPage();
    const user = userEvent.setup();

    expect(screen.getByRole("button", { name: "Buscar" })).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Buscar socio/a por número..."), "1");
    expect(screen.getByRole("button", { name: "Buscar" })).not.toBeDisabled();
  });
});
