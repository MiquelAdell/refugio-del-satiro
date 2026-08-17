export type LoanFeedbackVariant = "status" | "warning";

export interface LoanFeedback {
  readonly message: string;
  readonly variant: LoanFeedbackVariant;
}

const FORCED_RETURN_SUCCESS_MESSAGE =
  "Devolución forzada. Se ha avisado por correo a la persona que tenía el préstamo.";
const FORCED_RETURN_WARNING_MESSAGE =
  "La devolución se ha registrado, pero no se pudo enviar el correo de aviso.";

export function getForcedReturnFeedback(
  emailSent: boolean | null,
): LoanFeedback | null {
  if (emailSent === null) return null;

  return emailSent
    ? { message: FORCED_RETURN_SUCCESS_MESSAGE, variant: "status" }
    : { message: FORCED_RETURN_WARNING_MESSAGE, variant: "warning" };
}
