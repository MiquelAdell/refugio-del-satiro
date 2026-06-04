import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders its label", () => {
    render(<Badge>Disponible</Badge>);
    expect(screen.getByText("Disponible")).toBeInTheDocument();
  });

  it("defaults to the neutral variant", () => {
    render(<Badge>Texto</Badge>);
    expect(screen.getByText("Texto").className).toMatch(/variant-neutral/);
  });

  it("applies the requested variant", () => {
    render(<Badge variant="lent">Prestado</Badge>);
    expect(screen.getByText("Prestado").className).toMatch(/variant-lent/);
  });
});
