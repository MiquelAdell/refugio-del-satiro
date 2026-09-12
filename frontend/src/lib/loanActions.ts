import type { CurrentMember } from "../types/member";

export const BORROW_SUCCESS_MESSAGE =
  "El préstamo no tiene fecha límite, pero haz un uso responsable: devuélvelo cuando hayas jugado o si finalmente no vas a usarlo.";

interface LoanState {
  readonly status: "available" | "lent";
  readonly loan_id: number | null;
}

export interface ReturnAction {
  readonly label: "Devolver" | "Forzar devolución";
}

export function getReturnAction(
  member: CurrentMember | null,
  loan: LoanState,
  activeLoanIds: ReadonlySet<number>,
): ReturnAction | null {
  const isBorrower = loan.loan_id !== null && activeLoanIds.has(loan.loan_id);
  const canReturn =
    member !== null &&
    loan.status === "lent" &&
    loan.loan_id !== null &&
    (member.is_admin || isBorrower);

  if (!canReturn) return null;

  const isForcingAnotherMembersReturn = member.is_admin && !isBorrower;

  return {
    label: isForcingAnotherMembersReturn ? "Forzar devolución" : "Devolver",
  };
}
