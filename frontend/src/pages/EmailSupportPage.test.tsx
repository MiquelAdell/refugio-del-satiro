import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmailSupportPage } from "./EmailSupportPage";

describe("EmailSupportPage", () => {
  it("opens the device email handler and provides a fallback link", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { assign });

    render(<EmailSupportPage />);

    expect(assign).toHaveBeenCalledExactlyOnceWith(
      "mailto:refugiodelsatiro+prestamos@gmail.com?subject=Incidencia%20con%20un%20prestamo",
    );
    expect(
      screen.getByRole("link", { name: "refugiodelsatiro+prestamos@gmail.com" }),
    ).toHaveAttribute(
      "href",
      "mailto:refugiodelsatiro+prestamos@gmail.com?subject=Incidencia%20con%20un%20prestamo",
    );
  });
});
