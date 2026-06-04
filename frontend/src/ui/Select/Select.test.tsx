import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "./Select";

const options = [
  { value: "name", label: "Nombre" },
  { value: "rating", label: "Valoración" },
];

describe("Select", () => {
  it("renders the label and the options in order", () => {
    render(<Select label="Ordenar" options={options} />);
    const select = screen.getByLabelText("Ordenar") as HTMLSelectElement;
    const renderedOptions = Array.from(select.options).map((o) => o.label);
    expect(renderedOptions).toEqual(["Nombre", "Valoración"]);
  });

  it("propagates value changes via onChange", async () => {
    const handleChange = vi.fn();
    render(
      <Select label="Ordenar" options={options} onChange={handleChange} />
    );
    await userEvent.selectOptions(screen.getByLabelText("Ordenar"), "rating");
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});
