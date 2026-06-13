import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface CatalogMode {
  readonly isGuest: boolean;
}

const CatalogModeContext = createContext<CatalogMode>({ isGuest: true });

export function CatalogModeProvider({ children }: { readonly children: ReactNode }) {
  const { member, loading } = useAuth();
  // While auth resolves, default to guest (safe — no member-only actions exposed).
  const isGuest = loading ? true : member === null;

  return (
    <CatalogModeContext.Provider value={{ isGuest }}>
      {children}
    </CatalogModeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCatalogMode(): CatalogMode {
  return useContext(CatalogModeContext);
}
