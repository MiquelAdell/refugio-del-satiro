import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Chip } from "./Chip";

describe("Chip", () => {
  it("renders the label", () => {
    render(<Chip>Disponibles</Chip>);
    expect(screen.getByText("Disponibles")).toBeInTheDocument();
  });

  it("renders no remove button when onRemove is not provided", () => {
    render(<Chip>Disponibles</Chip>);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("fires onRemove when the remove button is clicked", async () => {
    const handleRemove = vi.fn();
    render(<Chip onRemove={handleRemove}>2-4 jugadores</Chip>);
    await userEvent.click(
      screen.getByRole("button", { name: "Quitar filtro" })
    );
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });
});
