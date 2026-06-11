import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import type { RpgItem } from "../types/rpg";

interface UseRpgItemsResult {
  readonly items: readonly RpgItem[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly refetch: () => void;
}

export function useRpgItems(): UseRpgItemsResult {
  const [items, setItems] = useState<readonly RpgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch<readonly RpgItem[]>("/rol")
      .then(setItems)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, loading, error, refetch: fetchItems };
}
