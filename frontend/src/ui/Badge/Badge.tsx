import type { ReactNode } from "react";
import styles from "./Badge.module.css";

type Variant = "available" | "lent" | "neutral" | "rating";

export interface BadgeProps {
  readonly variant?: Variant;
  readonly children: ReactNode;
  readonly className?: string;
}

export function Badge({
  variant = "neutral",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={[styles.badge, styles[`variant-${variant}`], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
