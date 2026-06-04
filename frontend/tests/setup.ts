import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Default fetch mock — returns a minimal valid _nav.json for any test that
// does not override it. Tests that exercise specific nav scenarios supply their
// own vi.mocked(fetch).mockResolvedValueOnce(...).
const DEFAULT_NAV_JSON = {
  version: 1,
  generated_at: "2026-01-01T00:00:00Z",
  items: [
    { label: "Inicio", href: "/inicio" },
    { label: "Calendario", href: "/calendario" },
  ],
};

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve(DEFAULT_NAV_JSON),
} as unknown as Response);
