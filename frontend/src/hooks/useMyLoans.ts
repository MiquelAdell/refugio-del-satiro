import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../api/client";
import type { ActiveLoan } from "../types/loan";

interface UseMyLoansResult {
  readonly loans: readonly ActiveLoan[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly refetch: () => void;
}

export function useMyLoans(enabled = true): UseMyLoansResult {
  const [loans, setLoans] = useState<readonly ActiveLoan[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const requestGeneration = useRef(0);

  const fetchLoans = useCallback(() => {
    const generation = ++requestGeneration.current;

    if (!enabled) {
      setLoans([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    apiFetch<readonly ActiveLoan[]>("/my-loans")
      .then((nextLoans) => {
        if (generation === requestGeneration.current) setLoans(nextLoans);
      })
      .catch((err: Error) => {
        if (generation === requestGeneration.current) setError(err.message);
      })
      .finally(() => {
        if (generation === requestGeneration.current) setLoading(false);
      });
  }, [enabled]);

  useEffect(() => {
    fetchLoans();

    return () => {
      requestGeneration.current += 1;
    };
  }, [fetchLoans]);

  return { loans, loading, error, refetch: fetchLoans };
}
