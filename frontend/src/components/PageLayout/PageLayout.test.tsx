import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import { PageLayout } from "./PageLayout";

vi.mock("../SiteHeader", () => ({
  SiteHeader: () => <header data-testid="site-header">Header</header>,
}));

vi.mock("../SiteFooter", () => ({
  SiteFooter: () => <footer data-testid="site-footer">Footer</footer>,
}));

describe("PageLayout", () => {
  function renderLayout(children?: React.ReactNode) {
    return render(
      <MemoryRouter>
        <PageLayout>{children}</PageLayout>
      </MemoryRouter>
    );
  }

  describe("DOM composition", () => {
    it("renders SiteHeader, main, and SiteFooter", () => {
      renderLayout();

      expect(screen.getByTestId("site-header")).toBeDefined();
      expect(screen.getByRole("main")).toBeDefined();
      expect(screen.getByTestId("site-footer")).toBeDefined();
    });

    it("renders header before main and main before footer", () => {
      const { container } = renderLayout();

      const children = Array.from(container.firstElementChild!.children);
      const header = children.find((el) => el.getAttribute("data-testid") === "site-header");
      const main = children.find((el) => el.tagName === "MAIN");
      const footer = children.find((el) => el.getAttribute("data-testid") === "site-footer");

      expect(header).toBeDefined();
      expect(main).toBeDefined();
      expect(footer).toBeDefined();

      const headerIdx = children.indexOf(header!);
      const mainIdx = children.indexOf(main!);
      const footerIdx = children.indexOf(footer!);

      expect(headerIdx).toBeLessThan(mainIdx);
      expect(mainIdx).toBeLessThan(footerIdx);
    });

    it("renders children inside main", () => {
      renderLayout(<p>Page content</p>);

      const main = screen.getByRole("main");
      expect(main.textContent).toContain("Page content");
    });
  });
});
