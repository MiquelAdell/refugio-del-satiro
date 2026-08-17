import { describe, expect, it } from "vitest";
import { getForcedReturnFeedback } from "./loanFeedback";

describe("getForcedReturnFeedback", () => {
  it("returns polite status feedback when the forced-return email is sent", () => {
    expect(getForcedReturnFeedback(true)).toEqual({
      message:
        "Devolución forzada. Se ha avisado por correo a la persona que tenía el préstamo.",
      variant: "status",
    });
  });

  it("returns warning feedback when the forced-return email cannot be sent", () => {
    expect(getForcedReturnFeedback(false)).toEqual({
      message:
        "La devolución se ha registrado, pero no se pudo enviar el correo de aviso.",
      variant: "warning",
    });
  });

  it("returns no feedback for an ordinary borrower return", () => {
    expect(getForcedReturnFeedback(null)).toBeNull();
  });
});
