import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../api/client";
import type { AdminActiveLoan } from "../types/loan";

interface UseAdminActiveLoansResult {
  readonly loans: readonly AdminActiveLoan[];
  readonly loading: boolean;
  readonly error: string | null;
}

export function useAdminActiveLoans(
  enabled = true,
): UseAdminActiveLoansResult {
  const [loans, setLoans] = useState<readonly AdminActiveLoan[]>([]);
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
    apiFetch<readonly AdminActiveLoan[]>("/admin/loans/active")
      .then((nextLoans) => {
        if (generation === requestGeneration.current) setLoans(nextLoans);
      })
      .catch((err: unknown) => {
        if (generation === requestGeneration.current) {
          setError(
            err instanceof Error
              ? err.message
              : "No se han podido cargar los préstamos activos.",
          );
        }
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

  return { loans, loading, error };
}
