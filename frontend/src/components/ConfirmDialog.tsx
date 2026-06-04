import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import "./ConfirmDialog.css";

interface ConfirmDialogProps {
  readonly message: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
}

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
}: ConfirmDialogProps) {
  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
      description={message}
    >
      <div className="confirm-dialog-actions">
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="primary" onClick={onConfirm} autoFocus>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
