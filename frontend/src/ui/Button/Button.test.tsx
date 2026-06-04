import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renders its label", () => {
    render(<Button>Confirmar</Button>);
    expect(
      screen.getByRole("button", { name: "Confirmar" })
    ).toBeInTheDocument();
  });

  it("fires onClick when clicked", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", async () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );
    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(0);
  });

  it("defaults to variant primary and size md", () => {
    render(<Button>Default</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toMatch(/variant-primary/);
    expect(btn.className).toMatch(/size-md/);
  });

  it("applies the requested variant and size", () => {
    render(
      <Button variant="secondary" size="lg">
        Big
      </Button>
    );
    const btn = screen.getByRole("button");
    expect(btn.className).toMatch(/variant-secondary/);
    expect(btn.className).toMatch(/size-lg/);
  });
});
