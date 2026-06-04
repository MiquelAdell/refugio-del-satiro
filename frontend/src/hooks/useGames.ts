import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import type { GameWithStatus } from "../types/game";

interface UseGamesResult {
  readonly games: readonly GameWithStatus[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly refetch: () => void;
}

export function useGames(): UseGamesResult {
  const [games, setGames] = useState<readonly GameWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch<readonly GameWithStatus[]>("/juegos")
      .then(setGames)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return { games, loading, error, refetch: fetchGames };
}
