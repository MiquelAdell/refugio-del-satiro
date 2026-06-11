import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import type { LoanHistoryEntry } from "../types/loan";
import type { RpgItem } from "../types/rpg";

interface UseRpgHistoryResult {
  readonly item: RpgItem | null;
  readonly history: readonly LoanHistoryEntry[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly refetch: () => void;
}

export function useRpgHistory(slug: string | undefined): UseRpgHistoryResult {
  const [item, setItem] = useState<RpgItem | null>(null);
  const [history, setHistory] = useState<readonly LoanHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(() => {
    if (!slug) {
      setLoading(false);
      setError("Identificador de libro no válido");
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      apiFetch<RpgItem>(`/rol/${slug}`),
      apiFetch<readonly LoanHistoryEntry[]>(`/rol/${slug}/history`),
    ])
      .then(([found, entries]) => {
        setItem(found);
        setHistory(entries);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { item, history, loading, error, refetch: fetchAll };
}
