import type { ReactNode } from "react";
import styles from "./PageTitle.module.css";

export interface PageTitleProps {
  readonly children: ReactNode;
}

export function PageTitle({ children }: PageTitleProps) {
  return <h1 className={styles.title}>{children}</h1>;
}
