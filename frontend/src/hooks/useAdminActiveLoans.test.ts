import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminActiveLoan } from "../types/loan";
import { useAdminActiveLoans } from "./useAdminActiveLoans";

const apiFetchMock = vi.fn();

vi.mock("../api/client", () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

const ACTIVE_LOAN: AdminActiveLoan = {
  loan_id: 7,
  game_id: 1,
  game_slug: "catan",
  item_type: "boardgame",
  game_name: "Catan",
  game_thumbnail_url: "https://example.com/catan.jpg",
  game_image_url: "https://example.com/catan-large.jpg",
  member_id: 42,
  member_display_name: "Ana García",
  borrowed_at: "2026-08-16T10:00:00Z",
};

describe("useAdminActiveLoans", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    apiFetchMock.mockResolvedValue([ACTIVE_LOAN]);
  });

  it("does not request active loans while the viewer is not an administrator", () => {
    const { result } = renderHook(() => useAdminActiveLoans(false));

    expect(apiFetchMock).not.toHaveBeenCalled();
    expect(result.current).toEqual({ loans: [], loading: false, error: null });
  });

  it("requests the protected active-loans endpoint for an administrator", async () => {
    const { result } = renderHook(() => useAdminActiveLoans());

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith("/admin/loans/active");
      expect(result.current).toEqual({
        loans: [ACTIVE_LOAN],
        loading: false,
        error: null,
      });
    });
  });
});
