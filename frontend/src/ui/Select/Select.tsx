import { useId } from "react";
import type { SelectHTMLAttributes } from "react";
import styles from "./Select.module.css";

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  readonly label?: string;
  readonly options: ReadonlyArray<SelectOption>;
}

export function Select({
  label,
  options,
  id,
  className,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={[styles.select, className].filter(Boolean).join(" ")}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
