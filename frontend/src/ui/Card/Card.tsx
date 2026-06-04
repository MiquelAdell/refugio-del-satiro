import type { ElementType, HTMLAttributes, ReactNode } from "react";
import styles from "./Card.module.css";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  readonly as?: ElementType;
  readonly clickable?: boolean;
  readonly children: ReactNode;
}

export function Card({
  as,
  clickable = false,
  className,
  children,
  ...rest
}: CardProps) {
  const Tag = (as ?? "div") as ElementType;
  const classes = [
    styles.card,
    clickable && styles.clickable,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const interactiveProps = clickable
    ? { tabIndex: 0, role: rest.role ?? "button" }
    : {};

  return (
    <Tag {...interactiveProps} {...rest} className={classes}>
      {children}
    </Tag>
  );
}
