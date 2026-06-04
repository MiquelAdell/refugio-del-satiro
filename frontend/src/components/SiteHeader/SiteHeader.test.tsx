import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { SiteHeader } from "./SiteHeader";
import type { NavItemsState } from "../../hooks/useNavItems";
import type { CurrentMember } from "../../types/member";

// ─── Constants ───────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItemsState["items"] = [
  { label: "Inicio", href: "/inicio" },
  { label: "Calendario", href: "/calendario" },
  { label: "Eventos", href: "/eventos" },
];

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("../../hooks/useNavItemsContext", () => ({
  useNavItemsContext: () => mockNavState,
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

let mockNavState: NavItemsState = { items: NAV_ITEMS, status: "ready" };

interface MockAuthState {
  member: CurrentMember | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const mockLogout = vi.fn();
let mockAuthState: MockAuthState = {
  member: null,
  loading: false,
  login: vi.fn(),
  logout: mockLogout,
};

function renderHeader(initialEntry = "/prestamos/") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SiteHeader />
    </MemoryRouter>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setGuest() {
  mockAuthState = { ...mockAuthState, member: null };
}

function setMember() {
  mockAuthState = {
    ...mockAuthState,
    member: {
      id: 1,
      email: "user@test.com",
      display_name: "Test User",
      is_admin: false,
    },
  };
}

function setAdmin() {
  mockAuthState = {
    ...mockAuthState,
    member: {
      id: 2,
      email: "admin@test.com",
      display_name: "Admin User",
      is_admin: true,
    },
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("SiteHeader", () => {
  beforeEach(() => {
    mockNavState = { items: NAV_ITEMS, status: "ready" };
    mockLogout.mockReset();
    setGuest();
  });

  describe("fetched nav items", () => {
    it("renders all fetched items as plain anchor tags in desktop nav in order", () => {
      const { container } = renderHeader();

      // Query within the desktop nav only (not the mobile drawer which also renders items)
      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      expect(desktopNav).not.toBeNull();

      const STATIC_HREFS = ["/inicio", "/calendario", "/eventos"];
      const rendered = Array.from(desktopNav!.querySelectorAll("a"))
        .filter((el) =>
          STATIC_HREFS.includes(el.getAttribute("href") ?? "")
        )
        .map((el) => ({
          label: el.textContent,
          href: el.getAttribute("href"),
        }));

      expect(rendered).toEqual([
        { label: "Inicio", href: "/inicio" },
        { label: "Calendario", href: "/calendario" },
        { label: "Eventos", href: "/eventos" },
      ]);
    });

    it("renders only the Préstamos parent when status is error", () => {
      mockNavState = { items: [], status: "error" };
      const { container } = renderHeader();

      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      expect(desktopNav).not.toBeNull();

      const navLinks = Array.from(desktopNav!.querySelectorAll("a")).map(
        (el) => el.textContent
      );
      expect(navLinks).not.toContain("Inicio");
      expect(navLinks).not.toContain("Calendario");
    });

    it("renders only the Préstamos parent when items is empty with ready status", () => {
      mockNavState = { items: [], status: "ready" };
      const { container } = renderHeader();

      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      // Get only direct children li of the top-level ul (not nested submenu li)
      const topNavList = desktopNav!.querySelector("ul");
      const topLevelItems = Array.from(topNavList!.children).map((li) => {
        const link = li.querySelector(":scope > a, :scope > button");
        return link?.textContent ?? "";
      });
      // With empty items, only Préstamos should be in the top-level nav
      expect(topLevelItems.map((t) => t.trim())).toEqual(["Préstamos"]);
    });
  });

  describe("Préstamos submenu — guest", () => {
    it("renders Préstamos as a plain link with no submenu and no chevron", () => {
      setGuest();
      renderHeader();

      // No menuitem roles at all — Préstamos is a plain link, no submenu rendered
      expect(screen.queryAllByRole("menuitem")).toEqual([]);
      // No aria-haspopup anywhere
      expect(
        document.querySelectorAll("[aria-haspopup='menu']").length
      ).toEqual(0);
    });

    it("does not show Mis préstamos, Cerrar sesión, or Administración for guest", () => {
      setGuest();
      renderHeader();

      expect(screen.queryByText("Mis préstamos")).toBeNull();
      expect(screen.queryByText("Cerrar sesión")).toBeNull();
      expect(screen.queryByText("Administración")).toBeNull();
    });

    it("renders the Iniciar sesión action link in the header for guest", () => {
      setGuest();
      const { container } = renderHeader();

      const loginLinks = Array.from(container.querySelectorAll("a")).filter(
        (el) => el.textContent?.trim() === "Iniciar sesión"
      );
      // One in the desktop header actions slot, one in the drawer = 2
      expect(loginLinks.length).toEqual(2);
      loginLinks.forEach((link) => {
        expect(link).toHaveAttribute("href", "/login");
      });
    });

    it("does not show Iniciar sesión inside the Préstamos submenu", () => {
      setGuest();
      renderHeader();

      // Iniciar sesión exists in header/drawer (covered above) but never as a menuitem
      const menuitems = screen
        .queryAllByRole("menuitem")
        .map((el) => el.textContent?.trim());
      expect(menuitems).toEqual([]);
    });
  });

  describe("Iniciar sesión action — authenticated users", () => {
    it("is not rendered for member", () => {
      setMember();
      const { container } = renderHeader();

      const loginLinks = Array.from(container.querySelectorAll("a")).filter(
        (el) => el.textContent?.trim() === "Iniciar sesión"
      );
      expect(loginLinks).toEqual([]);
    });

    it("is not rendered for admin", () => {
      setAdmin();
      const { container } = renderHeader();

      const loginLinks = Array.from(container.querySelectorAll("a")).filter(
        (el) => el.textContent?.trim() === "Iniciar sesión"
      );
      expect(loginLinks).toEqual([]);
    });
  });

  describe("Préstamos submenu — member", () => {
    it("renders exactly Mis préstamos in submenu (not Cerrar sesión) for member", () => {
      setMember();
      renderHeader();

      const submenuItems = screen
        .getAllByRole("menuitem")
        .map((el) => el.textContent?.trim());

      expect(submenuItems).toEqual(["Mis préstamos"]);

      const misPrestamosLinks = screen
        .getAllByRole("menuitem")
        .filter((el) => el.textContent?.trim() === "Mis préstamos")
        .map((el) => el.querySelector("a"));
      misPrestamosLinks.forEach((link) => {
        expect(link).toHaveAttribute("href", "/my-loans");
      });
    });

    it("shows Cerrar sesión button in header actions (not in submenu) for member", () => {
      setMember();
      renderHeader();

      // The desktop header actions slot is always in the DOM; the drawer is aria-hidden when closed
      const cerrarBtns = screen.getAllByRole("button", { name: "Cerrar sesión" });
      expect(cerrarBtns.length).toEqual(1);

      const menuitems = screen.getAllByRole("menuitem").map((el) => el.textContent?.trim());
      expect(menuitems).not.toContain("Cerrar sesión");
    });

    it("does not show Iniciar sesión or Administración for member", () => {
      setMember();
      renderHeader();

      expect(screen.queryByText("Iniciar sesión")).toBeNull();
      expect(screen.queryByText("Administración")).toBeNull();
    });
  });

  describe("Préstamos submenu — admin", () => {
    it("renders Mis préstamos in submenu but not Cerrar sesión for admin", () => {
      setAdmin();
      renderHeader();

      const submenuItems = screen
        .getAllByRole("menuitem")
        .map((el) => el.textContent?.trim());

      // Admin sees link items in submenu; Cerrar sesión is now in the header actions slot
      expect(submenuItems).toContain("Mis préstamos");
      expect(submenuItems).not.toContain("Cerrar sesión");

      // Cerrar sesión is a button in the header actions area; drawer is aria-hidden when closed
      const cerrarBtns = screen.getAllByRole("button", { name: "Cerrar sesión" });
      expect(cerrarBtns.length).toEqual(1);
    });

    it("renders the Administración nested parent for admin", () => {
      setAdmin();
      renderHeader();

      // The nested trigger renders as a button inside a menuitem
      expect(screen.getByText("Administración").tagName).toEqual("BUTTON");
    });

    it("renders Miembros and Contenido as nested items for admin", () => {
      setAdmin();
      renderHeader();

      expect(screen.getByText("Miembros").tagName).toEqual("A");
      expect(screen.getByText("Contenido").tagName).toEqual("A");
    });

    it("does not show nested admin items for guest", () => {
      setGuest();
      renderHeader();

      expect(screen.queryByText("Miembros")).toBeNull();
      expect(screen.queryByText("Contenido")).toBeNull();
    });

    it("does not show nested admin items for non-admin member", () => {
      setMember();
      renderHeader();

      expect(screen.queryByText("Miembros")).toBeNull();
      expect(screen.queryByText("Contenido")).toBeNull();
    });
  });

  describe("Cerrar sesión action", () => {
    it("calls logout when Cerrar sesión is clicked", async () => {
      setMember();
      mockLogout.mockResolvedValue(undefined);
      renderHeader();

      const cerrarBtn = screen.getAllByRole("button", { name: "Cerrar sesión" })[0];
      fireEvent.click(cerrarBtn!);

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe("user actions — authenticated", () => {
    it("shows display_name in header for member", () => {
      setMember();
      renderHeader();

      // Displayed in both desktop header actions slot and mobile drawer
      const displayNameEls = screen.getAllByText("Test User");
      expect(displayNameEls.length).toEqual(2);
    });

    it("shows Cerrar sesión button in header for member (not in submenu)", () => {
      setMember();
      renderHeader();

      // Desktop header actions slot only — drawer is aria-hidden when closed
      const cerrarBtns = screen.getAllByRole("button", { name: "Cerrar sesión" });
      expect(cerrarBtns.length).toEqual(1);

      const menuitems = screen.getAllByRole("menuitem").map((el) => el.textContent?.trim());
      expect(menuitems).not.toContain("Cerrar sesión");
    });

    it("does not show Cerrar sesión in Préstamos submenu for member", () => {
      setMember();
      renderHeader();

      const menuitems = screen.getAllByRole("menuitem").map((el) => el.textContent?.trim());
      expect(menuitems).toEqual(["Mis préstamos"]);
    });

    it("shows display_name and Cerrar sesión in drawer without expanding Préstamos", () => {
      setMember();
      mockLogout.mockResolvedValue(undefined);
      const { container } = renderHeader();

      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      fireEvent.click(hamburger);

      const drawer = container.querySelector("#mobile-drawer") as HTMLElement;
      const drawerUserName = within(drawer).getByText("Test User");
      expect(drawerUserName.textContent).toEqual("Test User");

      const cerrarBtn = within(drawer).getByRole("button", { name: "Cerrar sesión" });
      fireEvent.click(cerrarBtn);
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(hamburger.getAttribute("aria-expanded")).toEqual("false");
    });

    it("does not show Iniciar sesión for member", () => {
      setMember();
      renderHeader();

      expect(screen.queryByText("Iniciar sesión")).toBeNull();
    });
  });

  describe("active-route highlighting", () => {
    it("Préstamos parent has active class when at /prestamos/my-loans", () => {
      setMember();
      const { container } = renderHeader("/prestamos/my-loans");

      // Find the Préstamos <Link> element in the desktop nav (not the mobile drawer button)
      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      const prestamosNavItem = Array.from(desktopNav!.querySelectorAll("li")).find(
        (li) => li.querySelector("a")?.textContent?.includes("Préstamos")
      );
      expect(prestamosNavItem?.className).toContain("active");
    });

    it("Préstamos parent has active class when at /prestamos/", () => {
      const { container } = renderHeader("/prestamos/");

      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      const prestamosNavItem = Array.from(desktopNav!.querySelectorAll("li")).find(
        (li) => li.querySelector("a")?.textContent?.includes("Préstamos")
      );
      expect(prestamosNavItem?.className).toContain("active");
    });
  });

  describe("mobile burger drawer", () => {
    it("hamburger button is present in the DOM", () => {
      renderHeader();

      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      expect(hamburger.tagName).toEqual("BUTTON");
    });

    it("hamburger starts with aria-expanded false", () => {
      renderHeader();

      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      expect(hamburger.getAttribute("aria-expanded")).toEqual("false");
    });

    it("clicking hamburger opens the drawer and sets aria-expanded true", () => {
      renderHeader();

      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      fireEvent.click(hamburger);

      expect(hamburger.getAttribute("aria-expanded")).toEqual("true");
    });

    it("clicking hamburger twice closes the drawer", () => {
      renderHeader();

      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      fireEvent.click(hamburger);
      fireEvent.click(hamburger);

      expect(hamburger.getAttribute("aria-expanded")).toEqual("false");
    });

    it("Escape closes the drawer", () => {
      renderHeader();

      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      fireEvent.click(hamburger);
      expect(hamburger.getAttribute("aria-expanded")).toEqual("true");

      fireEvent.keyDown(document, { key: "Escape" });
      expect(hamburger.getAttribute("aria-expanded")).toEqual("false");
    });

    it("tapping Préstamos in drawer toggles prestamos submenu", () => {
      setMember();
      renderHeader();

      // Open drawer first
      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      fireEvent.click(hamburger);

      // There are two "Préstamos" triggers: one in desktop nav (Link), one in drawer (button)
      const prestamosButtons = screen.getAllByRole("button").filter(
        (el) => el.textContent?.includes("Préstamos")
      );
      // The drawer one has aria-haspopup
      const drawerPrestamos = prestamosButtons.find(
        (el) => el.getAttribute("aria-haspopup") === "menu"
      );
      expect(drawerPrestamos).toBeDefined();

      expect(drawerPrestamos!.getAttribute("aria-expanded")).toEqual("false");
      fireEvent.click(drawerPrestamos!);
      expect(drawerPrestamos!.getAttribute("aria-expanded")).toEqual("true");
    });

    // draw-6: nested Administración expands inside drawer
    it("nested Administración submenu items become visible after opening in drawer (draw-6)", () => {
      setAdmin();
      const { container } = renderHeader();

      // Open drawer
      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      fireEvent.click(hamburger);

      const drawer = container.querySelector("#mobile-drawer") as HTMLElement;
      expect(drawer).not.toBeNull();

      // Open Préstamos in drawer
      const drawerPrestamos = within(drawer)
        .getAllByRole("button")
        .find(
          (el) =>
            el.textContent?.includes("Préstamos") &&
            el.getAttribute("aria-haspopup") === "menu"
        );
      expect(drawerPrestamos).toBeDefined();
      fireEvent.click(drawerPrestamos!);

      // Click the Administración nested trigger
      const adminTrigger = within(drawer)
        .getAllByRole("button")
        .find((el) => el.textContent?.includes("Administración"));
      expect(adminTrigger).toBeDefined();
      fireEvent.click(adminTrigger!);

      // Miembros and Contenido links are now visible inside the drawer
      expect(within(drawer).getByText("Miembros").tagName).toEqual("A");
      expect(within(drawer).getByText("Contenido").tagName).toEqual("A");

      const miembrosLinks = within(drawer)
        .getAllByRole("menuitem")
        .filter((el) => el.textContent?.trim() === "Miembros");
      const contenidoLinks = within(drawer)
        .getAllByRole("menuitem")
        .filter((el) => el.textContent?.trim() === "Contenido");

      expect(miembrosLinks.length).toEqual(1);
      expect(contenidoLinks.length).toEqual(1);
    });

    // auth-5: Cerrar sesión in drawer closes the drawer
    it("clicking Cerrar sesión in drawer calls logout and closes the drawer (auth-5)", () => {
      setMember();
      mockLogout.mockResolvedValue(undefined);
      const { container } = renderHeader();

      // Open drawer
      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      fireEvent.click(hamburger);
      expect(hamburger.getAttribute("aria-expanded")).toEqual("true");

      const drawer = container.querySelector("#mobile-drawer") as HTMLElement;
      expect(drawer).not.toBeNull();

      // Cerrar sesión is at the top of the drawer — no need to expand Préstamos submenu
      const cerrarBtn = within(drawer).getByRole("button", { name: "Cerrar sesión" });
      fireEvent.click(cerrarBtn);

      expect(mockLogout).toHaveBeenCalledTimes(1);
      // Drawer closes after logout
      expect(hamburger.getAttribute("aria-expanded")).toEqual("false");
    });
  });

  // nav-logo-1: logo anchor links to /inicio
  describe("logo", () => {
    it("logo link points to /inicio (nav-logo-1)", () => {
      const { container } = renderHeader();

      const logoLink = container.querySelector("a[aria-label='Refugio del Sátiro – Inicio']");
      expect(logoLink).not.toBeNull();
      expect(logoLink!.getAttribute("href")).toEqual("/inicio");
    });

    // nav-logo-2: logo img has correct alt text
    it("logo img has alt text 'El Refugio del Sátiro' (nav-logo-2)", () => {
      renderHeader();

      const logoImg = screen.getByAltText("El Refugio del Sátiro");
      expect(logoImg.tagName).toEqual("IMG");
    });
  });

  // submenu-admin-2: Miembros and Contenido href values
  describe("admin nested link hrefs (submenu-admin-2)", () => {
    it("Miembros link has href /admin/members", () => {
      setAdmin();
      const { container } = renderHeader();

      const allLinks = Array.from(container.querySelectorAll("a"));
      const miembrosLink = allLinks.find((el) => el.textContent?.trim() === "Miembros");
      expect(miembrosLink).not.toBeUndefined();
      // Plain MemoryRouter with no basename: Link to="/admin/members" renders /admin/members
      expect(miembrosLink!.getAttribute("href")).toEqual("/admin/members");
    });

    it("Contenido link has href /admin/content", () => {
      setAdmin();
      const { container } = renderHeader();

      const allLinks = Array.from(container.querySelectorAll("a"));
      const contenidoLink = allLinks.find((el) => el.textContent?.trim() === "Contenido");
      expect(contenidoLink).not.toBeUndefined();
      expect(contenidoLink!.getAttribute("href")).toEqual("/admin/content");
    });
  });

  // submenu-admin-3: Administración trigger in drawer toggles aria-expanded
  describe("Administración trigger aria-expanded in drawer (submenu-admin-3)", () => {
    it("Administración button aria-expanded flips true on first click, false on second", () => {
      setAdmin();
      const { container } = renderHeader();

      // Open drawer
      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      fireEvent.click(hamburger);

      const drawer = container.querySelector("#mobile-drawer") as HTMLElement;
      expect(drawer).not.toBeNull();

      // Open Préstamos in drawer
      const drawerPrestamos = within(drawer)
        .getAllByRole("button")
        .find(
          (el) =>
            el.textContent?.includes("Préstamos") &&
            el.getAttribute("aria-haspopup") === "menu"
        );
      expect(drawerPrestamos).toBeDefined();
      fireEvent.click(drawerPrestamos!);

      // Find Administración nested trigger inside drawer
      const adminTrigger = within(drawer)
        .getAllByRole("button")
        .find((el) => el.textContent?.includes("Administración"));
      expect(adminTrigger).toBeDefined();

      expect(adminTrigger!.getAttribute("aria-expanded")).toEqual("false");
      fireEvent.click(adminTrigger!);
      expect(adminTrigger!.getAttribute("aria-expanded")).toEqual("true");
      fireEvent.click(adminTrigger!);
      expect(adminTrigger!.getAttribute("aria-expanded")).toEqual("false");
    });
  });

  // chev-1: chevron SVG presence by auth state
  describe("chevron SVG presence (chev-1)", () => {
    it("Préstamos parent in desktop nav contains a chevron SVG for member", () => {
      setMember();
      const { container } = renderHeader();

      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      expect(desktopNav).not.toBeNull();

      // The Préstamos link element contains the ChevronDown SVG
      const prestamosLi = Array.from(desktopNav!.querySelectorAll("li")).find(
        (li) => li.textContent?.includes("Préstamos")
      );
      expect(prestamosLi).toBeDefined();
      const chevrons = prestamosLi!.querySelectorAll("svg");
      expect(chevrons.length).toEqual(1);
    });

    it("Préstamos parent in desktop nav contains a chevron SVG for admin", () => {
      setAdmin();
      const { container } = renderHeader();

      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      expect(desktopNav).not.toBeNull();

      const prestamosLi = Array.from(desktopNav!.querySelectorAll("li")).find(
        (li) => li.textContent?.includes("Préstamos")
      );
      expect(prestamosLi).toBeDefined();
      // Admin: 2 SVGs — one for Préstamos link chevron, one for Administración nested trigger chevron
      const chevrons = prestamosLi!.querySelectorAll("svg");
      expect(chevrons.length).toEqual(2);
    });

    it("Préstamos item in desktop nav has no chevron SVG for guest", () => {
      setGuest();
      const { container } = renderHeader();

      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      expect(desktopNav).not.toBeNull();

      const prestamosLi = Array.from(desktopNav!.querySelectorAll("li")).find(
        (li) => li.textContent?.trim() === "Préstamos"
      );
      expect(prestamosLi).toBeDefined();
      const chevrons = prestamosLi!.querySelectorAll("svg");
      expect(chevrons.length).toEqual(0);
    });
  });

  // err-2: rapid double-click on drawer Préstamos trigger leaves aria-expanded deterministic
  describe("rapid toggle is deterministic (err-2)", () => {
    it("double-click on drawer Préstamos trigger results in closed state", () => {
      setMember();
      renderHeader();

      // Open drawer
      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      fireEvent.click(hamburger);

      const drawerPrestamos = screen
        .getAllByRole("button")
        .find(
          (el) =>
            el.textContent?.includes("Préstamos") &&
            el.getAttribute("aria-haspopup") === "menu"
        );
      expect(drawerPrestamos).toBeDefined();

      // Rapid double-click: open then immediately close
      fireEvent.click(drawerPrestamos!);
      fireEvent.click(drawerPrestamos!);

      expect(drawerPrestamos!.getAttribute("aria-expanded")).toEqual("false");
    });
  });
});
