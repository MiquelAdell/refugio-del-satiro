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

vi.mock("../../context/CatalogModeContext", () => ({
  useCatalogMode: () => ({ isGuest: mockAuthState.member === null }),
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

function renderHeader(initialEntry = "/juegos-de-mesa") {
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

    it("renders only the Ludoteca parent when status is error", () => {
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

    it("renders only the Ludoteca parent when items is empty with ready status", () => {
      mockNavState = { items: [], status: "ready" };
      const { container } = renderHeader();

      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      // Get only direct children li of the top-level ul (not nested submenu li)
      const topNavList = desktopNav!.querySelector("ul");
      const topLevelItems = Array.from(topNavList!.children).map((li) => {
        const link = li.querySelector(":scope > a, :scope > button");
        return link?.textContent ?? "";
      });
      // With empty items, only Ludoteca should be in the top-level nav
      expect(topLevelItems.map((t) => t.trim())).toEqual(["Ludoteca"]);
    });
  });

  describe("Ludoteca submenu — guest", () => {
    it("renders Ludoteca as a plain link with no submenu and no chevron", () => {
      setGuest();
      renderHeader();

      // No menuitem roles at all — Ludoteca is a plain link, no submenu rendered
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

    it("renders the Iniciar sesión action link in the header for guest on a non-login route", () => {
      setGuest();
      const { container } = renderHeader("/forgot-password");

      const loginLinks = Array.from(container.querySelectorAll("a")).filter(
        (el) => el.textContent?.trim() === "Iniciar sesión"
      );
      // One in the desktop header actions slot, one in the drawer = 2
      expect(loginLinks.length).toEqual(2);
      loginLinks.forEach((link) => {
        expect(link).toHaveAttribute("href", "/login");
      });
    });

    it("does not render the Iniciar sesión action link for guest on /login", () => {
      setGuest();
      const { container } = renderHeader("/login");

      const loginLinks = Array.from(container.querySelectorAll("a")).filter(
        (el) => el.textContent?.trim() === "Iniciar sesión"
      );
      expect(loginLinks.length).toEqual(0);
    });

    it("does not show Iniciar sesión inside the Ludoteca submenu", () => {
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

  describe("Ludoteca submenu — member", () => {
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

  describe("Ludoteca submenu — admin", () => {
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
      expect(screen.getByText("Contenido GSite").tagName).toEqual("A");
    });

    it("does not show nested admin items for guest", () => {
      setGuest();
      renderHeader();

      expect(screen.queryByText("Miembros")).toBeNull();
      expect(screen.queryByText("Contenido GSite")).toBeNull();
    });

    it("does not show nested admin items for non-admin member", () => {
      setMember();
      renderHeader();

      expect(screen.queryByText("Miembros")).toBeNull();
      expect(screen.queryByText("Contenido GSite")).toBeNull();
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

    it("does not show Cerrar sesión in Ludoteca submenu for member", () => {
      setMember();
      renderHeader();

      const menuitems = screen.getAllByRole("menuitem").map((el) => el.textContent?.trim());
      expect(menuitems).toEqual(["Mis préstamos"]);
    });

    it("shows display_name and Cerrar sesión in drawer without expanding Ludoteca", () => {
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
    it("Ludoteca parent has active class when at /my-loans", () => {
      setMember();
      const { container } = renderHeader("/my-loans");

      // Find the Ludoteca <Link> element in the desktop nav (not the mobile drawer button)
      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      const ludotecaNavItem = Array.from(desktopNav!.querySelectorAll("li")).find(
        (li) => li.querySelector("a")?.textContent?.includes("Ludoteca")
      );
      expect(ludotecaNavItem?.className).toContain("active");
    });

    it("Ludoteca parent has active class when at /juegos-de-mesa", () => {
      const { container } = renderHeader("/juegos-de-mesa");

      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      const ludotecaNavItem = Array.from(desktopNav!.querySelectorAll("li")).find(
        (li) => li.querySelector("a")?.textContent?.includes("Ludoteca")
      );
      expect(ludotecaNavItem?.className).toContain("active");
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

    it("tapping Ludoteca in drawer toggles ludoteca submenu", () => {
      setMember();
      renderHeader();

      // Open drawer first
      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      fireEvent.click(hamburger);

      // There are two "Ludoteca" triggers: one in desktop nav (Link), one in drawer (button)
      const ludotecaButtons = screen.getAllByRole("button").filter(
        (el) => el.textContent?.includes("Ludoteca")
      );
      // The drawer one has aria-haspopup
      const drawerLudoteca = ludotecaButtons.find(
        (el) => el.getAttribute("aria-haspopup") === "menu"
      );
      expect(drawerLudoteca).toBeDefined();

      expect(drawerLudoteca!.getAttribute("aria-expanded")).toEqual("false");
      fireEvent.click(drawerLudoteca!);
      expect(drawerLudoteca!.getAttribute("aria-expanded")).toEqual("true");
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

      // Open Ludoteca in drawer
      const drawerLudoteca = within(drawer)
        .getAllByRole("button")
        .find(
          (el) =>
            el.textContent?.includes("Ludoteca") &&
            el.getAttribute("aria-haspopup") === "menu"
        );
      expect(drawerLudoteca).toBeDefined();
      fireEvent.click(drawerLudoteca!);

      // Click the Administración nested trigger
      const adminTrigger = within(drawer)
        .getAllByRole("button")
        .find((el) => el.textContent?.includes("Administración"));
      expect(adminTrigger).toBeDefined();
      fireEvent.click(adminTrigger!);

      // Miembros and Contenido links are now visible inside the drawer
      expect(within(drawer).getByText("Miembros").tagName).toEqual("A");
      expect(within(drawer).getByText("Contenido GSite").tagName).toEqual("A");

      const miembrosLinks = within(drawer)
        .getAllByRole("menuitem")
        .filter((el) => el.textContent?.trim() === "Miembros");
      const contenidoLinks = within(drawer)
        .getAllByRole("menuitem")
        .filter((el) => el.textContent?.trim() === "Contenido GSite");

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

      // Cerrar sesión is at the top of the drawer — no need to expand Ludoteca submenu
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

    // nav-logo-2: logo shows site name as visible text next to the icon
    it("logo renders site name text 'El Refugio del Sátiro' (nav-logo-2)", () => {
      const { container } = renderHeader();

      const logoLink = container.querySelector("a[aria-label='Refugio del Sátiro – Inicio']");
      expect(logoLink!.textContent).toContain("El Refugio del Sátiro");
      const logoImg = logoLink!.querySelector("img");
      expect(logoImg).not.toBeNull();
      expect(logoImg!.getAttribute("alt")).toEqual("");
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
      const contenidoLink = allLinks.find((el) => el.textContent?.trim() === "Contenido GSite");
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

      // Open Ludoteca in drawer
      const drawerLudoteca = within(drawer)
        .getAllByRole("button")
        .find(
          (el) =>
            el.textContent?.includes("Ludoteca") &&
            el.getAttribute("aria-haspopup") === "menu"
        );
      expect(drawerLudoteca).toBeDefined();
      fireEvent.click(drawerLudoteca!);

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
    it("Ludoteca parent in desktop nav contains a chevron SVG for member", () => {
      setMember();
      const { container } = renderHeader();

      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      expect(desktopNav).not.toBeNull();

      // The Ludoteca link element contains the ChevronDown SVG
      const ludotecaLi = Array.from(desktopNav!.querySelectorAll("li")).find(
        (li) => li.textContent?.includes("Ludoteca")
      );
      expect(ludotecaLi).toBeDefined();
      const chevrons = ludotecaLi!.querySelectorAll("svg");
      expect(chevrons.length).toEqual(1);
    });

    it("Ludoteca parent in desktop nav contains a chevron SVG for admin", () => {
      setAdmin();
      const { container } = renderHeader();

      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      expect(desktopNav).not.toBeNull();

      const ludotecaLi = Array.from(desktopNav!.querySelectorAll("li")).find(
        (li) => li.textContent?.includes("Ludoteca")
      );
      expect(ludotecaLi).toBeDefined();
      // Admin: 2 SVGs — one for Ludoteca link chevron, one for Administración nested trigger chevron
      const chevrons = ludotecaLi!.querySelectorAll("svg");
      expect(chevrons.length).toEqual(2);
    });

    it("Ludoteca item in desktop nav has no chevron SVG for guest", () => {
      setGuest();
      const { container } = renderHeader();

      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      expect(desktopNav).not.toBeNull();

      const ludotecaLi = Array.from(desktopNav!.querySelectorAll("li")).find(
        (li) => li.textContent?.trim() === "Ludoteca"
      );
      expect(ludotecaLi).toBeDefined();
      const chevrons = ludotecaLi!.querySelectorAll("svg");
      expect(chevrons.length).toEqual(0);
    });
  });

  // err-2: rapid double-click on drawer Ludoteca trigger leaves aria-expanded deterministic
  describe("rapid toggle is deterministic (err-2)", () => {
    it("double-click on drawer Ludoteca trigger results in closed state", () => {
      setMember();
      renderHeader();

      // Open drawer
      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      fireEvent.click(hamburger);

      const drawerLudoteca = screen
        .getAllByRole("button")
        .find(
          (el) =>
            el.textContent?.includes("Ludoteca") &&
            el.getAttribute("aria-haspopup") === "menu"
        );
      expect(drawerLudoteca).toBeDefined();

      // Rapid double-click: open then immediately close
      fireEvent.click(drawerLudoteca!);
      fireEvent.click(drawerLudoteca!);

      expect(drawerLudoteca!.getAttribute("aria-expanded")).toEqual("false");
    });
  });
});
