import "./LoanActionFeedback.css";

interface LoanActionFeedbackProps {
  readonly message: string | null;
}

export function LoanActionFeedback({ message }: LoanActionFeedbackProps) {
  if (message === null) return null;

  return (
    <p className="loan-action-feedback" role="status" aria-live="polite">
      {message}
    </p>
  );
}
