import { createContext, useContext, type ReactNode } from "react";

interface CatalogMode {
  readonly isGuest: boolean;
}

const CatalogModeContext = createContext<CatalogMode>({ isGuest: false });

export function CatalogModeProvider({
  isGuest,
  children,
}: {
  readonly isGuest: boolean;
  readonly children: ReactNode;
}) {
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
