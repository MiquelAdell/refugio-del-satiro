import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "./Card";

describe("Card", () => {
  it("renders its children inside a div by default", () => {
    render(<Card>Contenido</Card>);
    expect(screen.getByText("Contenido")).toBeInTheDocument();
  });

  it("renders as the requested element when `as` is provided", () => {
    render(
      <Card as="article" data-testid="card">
        Item
      </Card>
    );
    expect(screen.getByTestId("card").tagName).toBe("ARTICLE");
  });

  it("becomes focusable and gets a button role when clickable", () => {
    render(<Card clickable>Click</Card>);
    const el = screen.getByRole("button", { name: "Click" });
    expect(el).toHaveAttribute("tabindex", "0");
    expect(el.className).toMatch(/clickable/);
  });
});
