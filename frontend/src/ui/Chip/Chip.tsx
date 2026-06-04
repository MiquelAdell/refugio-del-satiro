import type { ReactNode } from "react";
import styles from "./Chip.module.css";

export interface ChipProps {
  readonly children: ReactNode;
  readonly onRemove?: () => void;
  readonly className?: string;
}

export function Chip({ children, onRemove, className }: ChipProps) {
  return (
    <span
      className={[styles.chip, className].filter(Boolean).join(" ")}
      role="status"
    >
      <span className={styles.label}>{children}</span>
      {onRemove && (
        <button
          type="button"
          className={styles.remove}
          onClick={onRemove}
          aria-label="Quitar filtro"
        >
          ×
        </button>
      )}
    </span>
  );
}
