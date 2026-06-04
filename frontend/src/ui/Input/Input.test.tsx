import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input";

describe("Input", () => {
  it("renders the label and connects it to the input via htmlFor", () => {
    render(<Input label="Email" />);
    const input = screen.getByLabelText("Email");
    expect(input.tagName).toBe("INPUT");
  });

  it("propagates value changes via onChange", async () => {
    const handleChange = vi.fn();
    render(<Input label="Name" onChange={handleChange} />);
    await userEvent.type(screen.getByLabelText("Name"), "Miquel");
    expect(handleChange).toHaveBeenCalledTimes(6);
  });

  it("renders an error message and marks the input invalid", () => {
    render(<Input label="Password" error="Demasiado corta" />);
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Demasiado corta");
  });
});
