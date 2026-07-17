import { catalogViews, type CatalogView } from "../types/catalog";

// DQ-2: the member's grid/list choice persists across reloads. The key is
// shared by both catalogs so the choice carries over between them.
const VIEW_STORAGE_KEY = "catalog-view-mode";

export function storedCatalogView(): CatalogView {
  const value = localStorage.getItem(VIEW_STORAGE_KEY);
  return catalogViews.includes(value as CatalogView)
    ? (value as CatalogView)
    : "grid";
}

export function persistCatalogView(view: CatalogView): void {
  localStorage.setItem(VIEW_STORAGE_KEY, view);
}
