import type { ReactNode } from "react";
import { SiteHeader } from "../SiteHeader";
import { SiteFooter } from "../SiteFooter";
import styles from "./PageLayout.module.css";

interface PageLayoutProps {
  readonly children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className={styles.layout}>
      <SiteHeader />
      <main className={styles.main}>{children}</main>
      <SiteFooter />
    </div>
  );
}
