import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActiveLoan } from "../types/loan";
import { useMyLoans } from "./useMyLoans";

const apiFetchMock = vi.fn();

vi.mock("../api/client", () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

const activeLoan: ActiveLoan = {
  loan_id: 7,
  game_id: 1,
  game_slug: "catan",
  item_type: "boardgame",
  game_name: "Catan",
  game_thumbnail_url: "https://example.com/catan.jpg",
  game_image_url: "https://example.com/catan-large.jpg",
  borrowed_at: "2026-08-16T10:00:00Z",
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

describe("useMyLoans", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    apiFetchMock.mockResolvedValue([activeLoan]);
  });

  it("does not request authenticated loans while disabled for a guest", () => {
    const { result } = renderHook(() => useMyLoans(false));

    expect(apiFetchMock).toHaveBeenCalledTimes(0);
    expect(result.current.loans).toEqual([]);
    expect(result.current.loading).toEqual(false);
    expect(result.current.error).toEqual(null);
  });

  it("fetches loans when an authenticated viewer enables the hook", async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useMyLoans(enabled),
      { initialProps: { enabled: false } },
    );

    rerender({ enabled: true });

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith("/my-loans");
      expect(result.current.loans).toEqual([activeLoan]);
      expect(result.current.loading).toEqual(false);
      expect(result.current.error).toEqual(null);
    });
  });

  it("ignores an older request that resolves after a newer refetch", async () => {
    const initialRequest = deferred<readonly ActiveLoan[]>();
    const refetchRequest = deferred<readonly ActiveLoan[]>();
    const newerLoan = { ...activeLoan, loan_id: 8, game_id: 2 };
    apiFetchMock
      .mockReset()
      .mockReturnValueOnce(initialRequest.promise)
      .mockReturnValueOnce(refetchRequest.promise);

    const { result } = renderHook(() => useMyLoans(true));
    expect(apiFetchMock).toHaveBeenCalledTimes(1);

    act(() => result.current.refetch());
    expect(apiFetchMock).toHaveBeenCalledTimes(2);

    await act(async () => refetchRequest.resolve([newerLoan]));
    expect(result.current.loans).toEqual([newerLoan]);
    expect(result.current.loading).toEqual(false);

    await act(async () => initialRequest.resolve([activeLoan]));
    expect(result.current.loans).toEqual([newerLoan]);
    expect(result.current.loading).toEqual(false);
    expect(result.current.error).toEqual(null);
  });

  it("ignores a pending authenticated response after the hook is disabled", async () => {
    const pendingRequest = deferred<readonly ActiveLoan[]>();
    apiFetchMock.mockReset().mockReturnValueOnce(pendingRequest.promise);

    const { result, rerender } = renderHook(
      ({ enabled }) => useMyLoans(enabled),
      { initialProps: { enabled: true } },
    );
    expect(apiFetchMock).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });
    expect(result.current.loans).toEqual([]);
    expect(result.current.loading).toEqual(false);
    expect(result.current.error).toEqual(null);

    await act(async () => pendingRequest.resolve([activeLoan]));
    expect(result.current.loans).toEqual([]);
    expect(result.current.loading).toEqual(false);
    expect(result.current.error).toEqual(null);
  });
});
