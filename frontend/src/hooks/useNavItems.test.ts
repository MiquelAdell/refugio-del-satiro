import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useNavItems } from "./useNavItems";

const VALID_ITEMS = [
  { label: "Inicio", href: "/inicio" },
  { label: "Calendario", href: "/calendario" },
  { label: "Eventos", href: "/eventos" },
] as const;

const VALID_NAV_JSON = {
  version: 1,
  generated_at: "2026-05-01T12:00:00Z",
  items: VALID_ITEMS,
};

function mockFetchOk(body: unknown) {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(body),
  } as unknown as Response);
}

function mockFetchStatus(status: number) {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve(null),
  } as unknown as Response);
}

function mockFetchJsonError() {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    json: () => Promise.reject(new SyntaxError("Unexpected token")),
  } as unknown as Response);
}

describe("useNavItems", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  describe("happy path", () => {
    it("returns status ready and the full items list on valid response", async () => {
      mockFetchOk(VALID_NAV_JSON);

      const { result } = renderHook(() => useNavItems());

      expect(result.current.status).toEqual("loading");
      expect(result.current.items).toEqual([]);

      await waitFor(() => {
        expect(result.current.status).toEqual("ready");
      });

      expect(result.current.items).toEqual(VALID_ITEMS);
    });

    it("fetches /_nav.json with cache: no-store", async () => {
      mockFetchOk(VALID_NAV_JSON);

      const { result } = renderHook(() => useNavItems());
      await waitFor(() => expect(result.current.status).toEqual("ready"));

      expect(fetch).toHaveBeenCalledWith("/_nav.json", { cache: "no-store" });
    });
  });

  describe("HTTP error", () => {
    it("returns status error and empty items on HTTP 404", async () => {
      mockFetchStatus(404);

      const { result } = renderHook(() => useNavItems());
      await waitFor(() => expect(result.current.status).toEqual("error"));

      expect(result.current.items).toEqual([]);
    });

    it("returns status error and empty items on HTTP 500", async () => {
      mockFetchStatus(500);

      const { result } = renderHook(() => useNavItems());
      await waitFor(() => expect(result.current.status).toEqual("error"));

      expect(result.current.items).toEqual([]);
    });
  });

  describe("malformed JSON", () => {
    it("returns status error and empty items when JSON parse fails", async () => {
      mockFetchJsonError();

      const { result } = renderHook(() => useNavItems());
      await waitFor(() => expect(result.current.status).toEqual("error"));

      expect(result.current.items).toEqual([]);
    });
  });

  describe("schema mismatch", () => {
    it("returns status error when version is wrong", async () => {
      mockFetchOk({ version: 2, generated_at: "2026-01-01T00:00:00Z", items: [] });

      const { result } = renderHook(() => useNavItems());
      await waitFor(() => expect(result.current.status).toEqual("error"));

      expect(result.current.items).toEqual([]);
    });

    it("returns status error when items contains a non-object entry", async () => {
      mockFetchOk({ version: 1, generated_at: "2026-01-01T00:00:00Z", items: ["oops"] });

      const { result } = renderHook(() => useNavItems());
      await waitFor(() => expect(result.current.status).toEqual("error"));

      expect(result.current.items).toEqual([]);
    });

    it("returns status error when an item is missing href", async () => {
      mockFetchOk({
        version: 1,
        generated_at: "2026-01-01T00:00:00Z",
        items: [{ label: "Inicio" }],
      });

      const { result } = renderHook(() => useNavItems());
      await waitFor(() => expect(result.current.status).toEqual("error"));

      expect(result.current.items).toEqual([]);
    });

    it("returns status error when the payload is not an object", async () => {
      mockFetchOk(null);

      const { result } = renderHook(() => useNavItems());
      await waitFor(() => expect(result.current.status).toEqual("error"));

      expect(result.current.items).toEqual([]);
    });
  });
});
