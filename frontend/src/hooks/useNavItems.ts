import { useEffect, useState } from "react";

export interface NavItem {
  readonly label: string;
  readonly href: string;
}

interface NavJson {
  readonly version: number;
  readonly generated_at: string;
  readonly items: readonly NavItem[];
}

export type NavStatus = "loading" | "ready" | "error";

export interface NavItemsState {
  readonly items: readonly NavItem[];
  readonly status: NavStatus;
}

function isNavItem(value: unknown): value is NavItem {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).label === "string" &&
    typeof (value as Record<string, unknown>).href === "string"
  );
}

function isNavJson(value: unknown): value is NavJson {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>).version === 1 &&
    typeof (value as Record<string, unknown>).generated_at === "string" &&
    Array.isArray((value as Record<string, unknown>).items) &&
    ((value as Record<string, unknown>).items as unknown[]).every(isNavItem)
  );
}

export function useNavItems(): NavItemsState {
  const [state, setState] = useState<NavItemsState>({
    items: [],
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;

    fetch("/_nav.json", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data: unknown) => {
        if (cancelled) return;
        if (!isNavJson(data)) {
          setState({ items: [], status: "error" });
          return;
        }
        setState({ items: data.items, status: "ready" });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ items: [], status: "error" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
