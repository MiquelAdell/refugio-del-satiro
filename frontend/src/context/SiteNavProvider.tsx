import type { ReactNode } from "react";
import { useNavItems } from "../hooks/useNavItems";
import { SiteNavContext } from "./SiteNavContext";

export function SiteNavProvider({ children }: { readonly children: ReactNode }) {
  const state = useNavItems();
  return (
    <SiteNavContext.Provider value={state}>{children}</SiteNavContext.Provider>
  );
}
