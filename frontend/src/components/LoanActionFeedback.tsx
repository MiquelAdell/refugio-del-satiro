import type { LoanFeedbackVariant } from "../lib/loanFeedback";
import "./LoanActionFeedback.css";

interface LoanActionFeedbackProps {
  readonly message: string | null;
  readonly variant?: LoanFeedbackVariant;
}

export function LoanActionFeedback({
  message,
  variant = "status",
}: LoanActionFeedbackProps) {
  if (message === null) return null;

  return (
    <p
      className={`loan-action-feedback loan-action-feedback--${variant}`}
      role={variant === "warning" ? "alert" : "status"}
      aria-live={variant === "status" ? "polite" : undefined}
    >
      {message}
    </p>
  );
}
