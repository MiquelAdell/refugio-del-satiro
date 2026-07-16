import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
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
      member_number: 101,
      first_name: "Test",
      last_name: "User",
      nickname: "Tester",
      phone: "600 00 00 01",
      email: "user@test.com",
      display_name: "Test User",
      is_admin: false,
      is_active: true,
      last_payment: "24/01/2026",
    },
  };
}

function setAdmin() {
  mockAuthState = {
    ...mockAuthState,
    member: {
      id: 2,
      member_number: 102,
      first_name: "Admin",
      last_name: "User",
      nickname: null,
      phone: "600 00 00 02",
      email: "admin@test.com",
      display_name: "Admin User",
      is_admin: true,
      is_active: true,
      last_payment: "24/01/2026",
    },
  };
}

/** Desktop user-menu trigger button (display name + chevron). */
function getUserMenuTrigger(container: HTMLElement, name: string) {
  return Array.from(container.querySelectorAll("button")).find(
    (el) =>
      el.textContent?.includes(name) &&
      el.getAttribute("aria-haspopup") === "menu" &&
      !el.closest("#mobile-drawer")
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("SiteHeader", () => {
  beforeEach(() => {
    mockNavState = { items: NAV_ITEMS, status: "ready" };
    mockLogout.mockReset();
    setGuest();
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
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

    it("renders no top-level items when status is error", () => {
      mockNavState = { items: [], status: "error" };
      const { container } = renderHeader();

      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      expect(desktopNav).not.toBeNull();

      const navLinks = Array.from(desktopNav!.querySelectorAll("a")).map(
        (el) => el.textContent
      );
      expect(navLinks).toEqual([]);
    });

    it("renders no top-level items when items is empty with ready status", () => {
      mockNavState = { items: [], status: "ready" };
      const { container } = renderHeader();

      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      const topNavList = desktopNav!.querySelector("ul");
      const topLevelItems = Array.from(topNavList!.children).map((li) => {
        const link = li.querySelector(":scope > a, :scope > button");
        return link?.textContent ?? "";
      });
      expect(topLevelItems).toEqual([]);
    });
  });

  describe("guest state", () => {
    it("shows no menuitems and no user menu for guest", () => {
      setGuest();
      renderHeader();

      expect(screen.queryAllByRole("menuitem")).toEqual([]);
      expect(
        document.querySelectorAll("[aria-haspopup='menu']").length
      ).toEqual(0);
    });

    it("does not show authenticated user-menu entries for guest", () => {
      setGuest();
      renderHeader();

      expect(screen.queryByText("Mi perfil")).toBeNull();
      expect(screen.queryByText("Mis préstamos")).toBeNull();
      expect(screen.queryByText("Cambiar contraseña")).toBeNull();
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

  describe("user menu — member", () => {
    it("renders a trigger with the display name and chevron in header actions", () => {
      setMember();
      const { container } = renderHeader();

      const trigger = getUserMenuTrigger(container, "Test User");
      expect(trigger).toBeDefined();
      expect(trigger!.querySelectorAll("svg").length).toEqual(1);
    });

    it("renders the exact member menu ordering", () => {
      setMember();
      renderHeader();

      // Desktop dropdown is always in the DOM (CSS-hidden); drawer submenu only
      // renders when expanded, so these come from the desktop menu.
      const menuitems = screen
        .getAllByRole("menuitem")
        .map((el) => el.textContent?.trim());
      expect(menuitems).toEqual([
        "Mi perfil",
        "Mis préstamos",
        "Cambiar contraseña",
        "Cerrar sesión",
      ]);
    });

    it("links Mi perfil to /profile", () => {
      setMember();
      renderHeader();

      const profileLinks = screen
        .getAllByRole("menuitem")
        .filter((el) => el.textContent?.trim() === "Mi perfil")
        .map((el) => el.querySelector("a"));
      expect(profileLinks).toEqual([expect.any(HTMLAnchorElement)]);
      expect(profileLinks[0]).toHaveAttribute("href", "/profile");
    });

    it("links Mis préstamos to /my-loans", () => {
      setMember();
      renderHeader();

      const misPrestamosLinks = screen
        .getAllByRole("menuitem")
        .filter((el) => el.textContent?.trim() === "Mis préstamos")
        .map((el) => el.querySelector("a"));
      misPrestamosLinks.forEach((link) => {
        expect(link).toHaveAttribute("href", "/my-loans");
      });
    });

    it("links Cambiar contraseña to /change-password", () => {
      setMember();
      renderHeader();

      const changePasswordLinks = screen
        .getAllByRole("menuitem")
        .filter((el) => el.textContent?.trim() === "Cambiar contraseña")
        .map((el) => el.querySelector("a"));
      changePasswordLinks.forEach((link) => {
        expect(link).toHaveAttribute("href", "/change-password");
      });
    });

    it("does not show Iniciar sesión or Administración for member", () => {
      setMember();
      renderHeader();

      expect(screen.queryByText("Iniciar sesión")).toBeNull();
      expect(screen.queryByText("Administración")).toBeNull();
    });

    it("shows display_name in desktop trigger and drawer section", () => {
      setMember();
      renderHeader();

      const displayNameEls = screen.getAllByText("Test User");
      expect(displayNameEls.length).toEqual(2);
    });
  });

  describe("user menu — admin", () => {
    it("renders the Administración nested parent for admin", () => {
      setAdmin();
      renderHeader();

      // The nested trigger renders as a button inside a menuitem
      expect(screen.getByText("Administración").tagName).toEqual("BUTTON");
    });

    it("renders Miembros, Contenido GSite and Datos BGG as nested items for admin", () => {
      setAdmin();
      renderHeader();

      expect(screen.getByText("Miembros").tagName).toEqual("A");
      expect(screen.getByText("Contenido GSite").tagName).toEqual("A");
      expect(screen.getByText("Datos BGG").tagName).toEqual("A");
    });

    it("renders the exact admin top-level menu ordering", () => {
      setAdmin();
      const { container } = renderHeader();

      const desktopMenu = container.querySelector(
        "div[class*='userMenu'] ul"
      ) as HTMLElement;
      const topLevelLabels = Array.from(desktopMenu.children).map((li) =>
        li.querySelector(":scope > a, :scope > button")?.textContent?.trim()
      );
      expect(topLevelLabels).toEqual([
        "Mi perfil",
        "Mis préstamos",
        "Cambiar contraseña",
        "Administración",
        "Cerrar sesión",
      ]);
    });

    it("links Mi perfil to /profile for admin", () => {
      setAdmin();
      renderHeader();

      const profileLink = screen
        .getAllByRole("menuitem")
        .find((el) => el.textContent?.trim() === "Mi perfil")
        ?.querySelector("a");
      expect(profileLink).toHaveAttribute("href", "/profile");
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

  describe("Cerrar sesión action", () => {
    it("renders Cerrar sesión as a menuitem inside the user menu (single instance while drawer collapsed)", () => {
      setMember();
      renderHeader();

      const cerrarBtns = screen.getAllByRole("button", { name: "Cerrar sesión" });
      expect(cerrarBtns.length).toEqual(1);
      expect(cerrarBtns[0]!.closest("[role='menuitem']")).not.toBeNull();
    });

    it("calls logout when Cerrar sesión is clicked", () => {
      setMember();
      mockLogout.mockResolvedValue(undefined);
      renderHeader();

      const cerrarBtn = screen.getAllByRole("button", { name: "Cerrar sesión" })[0];
      fireEvent.click(cerrarBtn!);

      expect(mockLogout).toHaveBeenCalledTimes(1);
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

    it("tapping the user name in drawer toggles the user submenu", () => {
      setMember();
      const { container } = renderHeader();

      // Open drawer first
      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      fireEvent.click(hamburger);

      const drawer = container.querySelector("#mobile-drawer") as HTMLElement;
      const userTrigger = within(drawer)
        .getAllByRole("button")
        .find(
          (el) =>
            el.textContent?.includes("Test User") &&
            el.getAttribute("aria-haspopup") === "menu"
        );
      expect(userTrigger).toBeDefined();

      expect(userTrigger!.getAttribute("aria-expanded")).toEqual("false");
      fireEvent.click(userTrigger!);
      expect(userTrigger!.getAttribute("aria-expanded")).toEqual("true");
      expect(within(drawer).getByText("Mi perfil")).toHaveAttribute(
        "href",
        "/profile"
      );
      expect(within(drawer).getByText("Mis préstamos").tagName).toEqual("A");
    });

    it("clicking Mi perfil in the drawer closes it", () => {
      setMember();
      const { container } = renderHeader();

      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      fireEvent.click(hamburger);

      const drawer = container.querySelector("#mobile-drawer") as HTMLElement;
      const userTrigger = within(drawer)
        .getAllByRole("button")
        .find(
          (el) =>
            el.textContent?.includes("Test User") &&
            el.getAttribute("aria-haspopup") === "menu"
        );
      fireEvent.click(userTrigger!);
      fireEvent.click(within(drawer).getByRole("link", { name: "Mi perfil" }));

      expect(hamburger.getAttribute("aria-expanded")).toEqual("false");
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

      // Expand the user section in drawer
      const userTrigger = within(drawer)
        .getAllByRole("button")
        .find(
          (el) =>
            el.textContent?.includes("Admin User") &&
            el.getAttribute("aria-haspopup") === "menu"
        );
      expect(userTrigger).toBeDefined();
      fireEvent.click(userTrigger!);

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

      // Expand the user section, then log out
      const userTrigger = within(drawer)
        .getAllByRole("button")
        .find(
          (el) =>
            el.textContent?.includes("Test User") &&
            el.getAttribute("aria-haspopup") === "menu"
        );
      fireEvent.click(userTrigger!);

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
      // Committed branding asset, absolute path valid on app and mirror pages
      expect(logoImg!.getAttribute("src")).toEqual("/ludoteca/branding/logo.png");
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

      // Expand the user section in drawer
      const userTrigger = within(drawer)
        .getAllByRole("button")
        .find(
          (el) =>
            el.textContent?.includes("Admin User") &&
            el.getAttribute("aria-haspopup") === "menu"
        );
      expect(userTrigger).toBeDefined();
      fireEvent.click(userTrigger!);

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

  // err-2: rapid double-click on drawer user trigger leaves aria-expanded deterministic
  describe("rapid toggle is deterministic (err-2)", () => {
    it("double-click on drawer user trigger results in closed state", () => {
      setMember();
      const { container } = renderHeader();

      // Open drawer
      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      fireEvent.click(hamburger);

      const drawer = container.querySelector("#mobile-drawer") as HTMLElement;
      const userTrigger = within(drawer)
        .getAllByRole("button")
        .find(
          (el) =>
            el.textContent?.includes("Test User") &&
            el.getAttribute("aria-haspopup") === "menu"
        );
      expect(userTrigger).toBeDefined();

      // Rapid double-click: open then immediately close
      fireEvent.click(userTrigger!);
      fireEvent.click(userTrigger!);

      expect(userTrigger!.getAttribute("aria-expanded")).toEqual("false");
    });
  });
});
