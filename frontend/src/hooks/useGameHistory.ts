import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import type { LoanHistoryEntry } from "../types/loan";
import type { GameWithStatus } from "../types/game";

interface UseGameHistoryResult {
  readonly game: GameWithStatus | null;
  readonly history: readonly LoanHistoryEntry[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly refetch: () => void;
}

export function useGameHistory(slug: string | undefined): UseGameHistoryResult {
  const [game, setGame] = useState<GameWithStatus | null>(null);
  const [history, setHistory] = useState<readonly LoanHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(() => {
    if (!slug) {
      setLoading(false);
      setError("Identificador de juego no válido");
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      apiFetch<GameWithStatus>(`/juegos/${slug}`),
      apiFetch<readonly LoanHistoryEntry[]>(`/juegos/${slug}/history`),
    ])
      .then(([found, entries]) => {
        setGame(found);
        setHistory(entries);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { game, history, loading, error, refetch: fetchAll };
}
