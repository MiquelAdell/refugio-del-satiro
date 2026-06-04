import type { ReactNode } from "react";
import styles from "./MinimalPageLayout.module.css";

interface MinimalPageLayoutProps {
  readonly children: ReactNode;
}

export function MinimalPageLayout({ children }: MinimalPageLayoutProps) {
  return (
    <div className={styles.layout}>
      <div className={styles.logoWrapper}>
        <a href="/inicio" aria-label="Refugio del Sátiro – Inicio">
          <img
            src="/_assets/200953ee27cc922e.png"
            alt="El Refugio del Sátiro"
            className={styles.logo}
            height="60"
          />
        </a>
      </div>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
