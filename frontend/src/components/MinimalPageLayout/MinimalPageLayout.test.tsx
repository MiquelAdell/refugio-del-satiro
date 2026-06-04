import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MinimalPageLayout } from "./MinimalPageLayout";

const LOGO_ALT = "El Refugio del Sátiro";

describe("MinimalPageLayout", () => {
  describe("DOM composition", () => {
    it("renders the club logo", () => {
      render(<MinimalPageLayout>content</MinimalPageLayout>);

      const logo = screen.getByAltText(LOGO_ALT);
      expect(logo.tagName).toEqual("IMG");
      expect((logo as HTMLImageElement).src).toContain("200953ee27cc922e.png");
    });

    it("renders children", () => {
      render(<MinimalPageLayout><p>Auth form</p></MinimalPageLayout>);

      expect(screen.getByText("Auth form")).toBeDefined();
    });

    it("does not render a site-header element", () => {
      render(<MinimalPageLayout>content</MinimalPageLayout>);

      // No nav landmark
      expect(screen.queryByRole("navigation")).toBeNull();
    });

    it("renders inside main element", () => {
      render(<MinimalPageLayout><span>child</span></MinimalPageLayout>);

      const main = screen.getByRole("main");
      expect(main.textContent).toContain("child");
    });
  });
});
