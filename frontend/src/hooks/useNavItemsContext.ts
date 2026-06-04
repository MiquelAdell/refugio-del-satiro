import { useContext } from "react";
import { SiteNavContext } from "../context/SiteNavContext";
import type { NavItemsState } from "./useNavItems";

export function useNavItemsContext(): NavItemsState {
  const context = useContext(SiteNavContext);
  if (context === null) {
    throw new Error("useNavItemsContext must be used within a SiteNavProvider");
  }
  return context;
}
