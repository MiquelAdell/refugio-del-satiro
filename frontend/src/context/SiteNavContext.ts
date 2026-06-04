import { createContext } from "react";
import type { NavItemsState } from "../hooks/useNavItems";

export const SiteNavContext = createContext<NavItemsState | null>(null);
