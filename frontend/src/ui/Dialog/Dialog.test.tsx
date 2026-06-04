import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "./Dialog";

describe("Dialog", () => {
  it("renders nothing when open is false", () => {
    render(
      <Dialog open={false} onOpenChange={() => undefined} title="Confirmar">
        <p>Body</p>
      </Dialog>
    );
    expect(screen.queryByText("Confirmar")).toBeNull();
    expect(screen.queryByText("Body")).toBeNull();
  });

  it("renders the title and body when open is true", () => {
    render(
      <Dialog open onOpenChange={() => undefined} title="Confirmar">
        <p>¿Estás seguro?</p>
      </Dialog>
    );
    expect(screen.getByText("Confirmar")).toBeInTheDocument();
    expect(screen.getByText("¿Estás seguro?")).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when the user presses Escape", async () => {
    const handleOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={handleOpenChange} title="Confirmar">
        <p>Body</p>
      </Dialog>
    );
    await userEvent.keyboard("{Escape}");
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });
});
