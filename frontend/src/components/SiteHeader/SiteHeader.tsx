import { useEffect, useRef, useState } from "react";
import { Link, useMatch } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNavItemsContext } from "../../hooks/useNavItemsContext";
import styles from "./SiteHeader.module.css";

function ChevronDown() {
  return (
    <svg
      className={styles.chevron}
      focusable="false"
      aria-hidden="true"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <g transform="translate(9.7,12) rotate(45)">
        <path d="M-4.2 0 L4.2 0" strokeWidth="2" />
      </g>
      <g transform="translate(14.3,12) rotate(-45)">
        <path d="M-4.2 0 L4.2 0" strokeWidth="2" />
      </g>
    </svg>
  );
}

// ─── Submenu item config ──────────────────────────────────────────────────────

type SubmenuRole = "guest" | "member" | "admin";

interface LinkSubmenuItem {
  readonly type: "link";
  readonly label: string;
  readonly to: string;
  readonly roles: readonly SubmenuRole[];
}

interface NestedSubmenuItem {
  readonly type: "nested";
  readonly label: string;
  readonly roles: readonly SubmenuRole[];
  readonly children: readonly LinkSubmenuItem[];
}

type SubmenuItem = LinkSubmenuItem | NestedSubmenuItem;

// `to` values are router-relative (inside `<BrowserRouter basename="/prestamos">`),
// so they omit the `/prestamos` prefix — the router prepends it.
const PRESTAMOS_SUBMENU: readonly SubmenuItem[] = [
  { type: "link", label: "Mis préstamos", to: "/my-loans", roles: ["member", "admin"] },
  {
    type: "nested",
    label: "Administración",
    roles: ["admin"],
    children: [
      { type: "link", label: "Miembros", to: "/admin/members", roles: ["admin"] },
      { type: "link", label: "Contenido", to: "/admin/content", roles: ["admin"] },
    ],
  },
];

// ─── AdminNestedSubmenu ───────────────────────────────────────────────────────

interface AdminNestedSubmenuProps {
  readonly item: NestedSubmenuItem;
  readonly mobileExpanded: boolean;
  readonly onToggleMobile: () => void;
  readonly onItemClick?: () => void;
}

function AdminNestedSubmenu({
  item,
  mobileExpanded,
  onToggleMobile,
  onItemClick,
}: AdminNestedSubmenuProps) {
  return (
    <li className={`${styles.submenuItem} ${styles.hasNested}`}>
      <button
        type="button"
        className={styles.nestedTrigger}
        aria-haspopup="menu"
        aria-expanded={mobileExpanded}
        onClick={onToggleMobile}
      >
        {item.label}
        <ChevronDown />
      </button>
      <ul
        className={`${styles.nestedList} ${mobileExpanded ? styles.nestedListOpen : ""}`}
        role="menu"
      >
        {item.children.map((child) => (
          <li key={child.to} className={styles.nestedItem} role="menuitem">
            <Link to={child.to} onClick={onItemClick}>
              {child.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

// ─── PrestamosSubmenu ─────────────────────────────────────────────────────────

interface PrestamosSubmenuProps {
  readonly role: SubmenuRole;
  readonly adminExpanded: boolean;
  readonly onToggleAdmin: () => void;
  readonly onItemClick?: () => void;
}

function PrestamosSubmenu({
  role,
  adminExpanded,
  onToggleAdmin,
  onItemClick,
}: PrestamosSubmenuProps) {
  const visibleItems = PRESTAMOS_SUBMENU.filter((item) =>
    item.roles.includes(role)
  );

  return (
    <ul className={styles.submenu} role="menu">
      {visibleItems.map((item) => {
        if (item.type === "nested") {
          return (
            <AdminNestedSubmenu
              key={item.label}
              item={item}
              mobileExpanded={adminExpanded}
              onToggleMobile={onToggleAdmin}
              onItemClick={onItemClick}
            />
          );
        }
        return (
          <li key={item.to} className={styles.submenuItem} role="menuitem">
            <Link to={item.to} onClick={onItemClick}>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// ─── SiteHeader ──────────────────────────────────────────────────────────────

export function SiteHeader() {
  const { items, status } = useNavItemsContext();
  const { member, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [prestamosExpanded, setPrestamosExpanded] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // In production the router runs under basename "/prestamos", so
  // `useMatch("/prestamos/*")` never matches against the basename-stripped
  // location. In tests we mount under a plain MemoryRouter where the path
  // does start with "/prestamos". Cover both by also checking the raw
  // browser pathname when it's available.
  const isPrestamosActive =
    useMatch("/prestamos/*") !== null ||
    (typeof window !== "undefined" &&
      window.location.pathname.startsWith("/prestamos"));

  const role: SubmenuRole =
    member?.is_admin === true
      ? "admin"
      : member !== null
        ? "member"
        : "guest";

  const hasPrestamosSubmenu = PRESTAMOS_SUBMENU.some((item) =>
    item.roles.includes(role)
  );

  // Close drawer and return focus on Escape
  useEffect(() => {
    if (!drawerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        hamburgerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const handleLogout = () => {
    void logout();
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setPrestamosExpanded(false);
    setAdminExpanded(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Logo */}
        <a href="/inicio" className={styles.logoLink} aria-label="Refugio del Sátiro – Inicio">
          <img
            src="/_assets/200953ee27cc922e.png"
            alt="El Refugio del Sátiro"
            className={styles.logo}
            height="40"
          />
        </a>

        {/* Desktop nav */}
        <nav className={styles.desktopNav} aria-label="Principal">
          <ul className={styles.navList}>
            {status !== "error" &&
              items.map((item) => (
                <li
                  key={item.href}
                  className={`${styles.navItem} ${
                    typeof window !== "undefined" &&
                    window.location.pathname === item.href
                      ? styles.active
                      : ""
                  }`}
                >
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}

            {/* Préstamos parent */}
            <li
              className={`${styles.navItem} ${hasPrestamosSubmenu ? styles.hasSubmenu : ""} ${
                isPrestamosActive ? styles.active : ""
              }`}
            >
              {hasPrestamosSubmenu ? (
                <>
                  <Link to="/" aria-haspopup="menu" aria-expanded={false}>
                    Préstamos
                    <ChevronDown />
                  </Link>
                  <PrestamosSubmenu
                    role={role}
                    adminExpanded={false}
                    onToggleAdmin={() => undefined}
                  />
                </>
              ) : (
                <Link to="/">Préstamos</Link>
              )}
            </li>
          </ul>
        </nav>

        {/* Right-side actions */}
        <div className={styles.headerActions}>
          {role === "guest" ? (
            <Link to="/login" className={styles.loginAction}>
              Iniciar sesión
            </Link>
          ) : (
            <>
              <span className={styles.userDisplayName}>{member!.display_name}</span>
              <button
                type="button"
                className={styles.logoutAction}
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          ref={hamburgerRef}
          type="button"
          className={styles.hamburger}
          aria-label="Abrir menú"
          aria-expanded={drawerOpen}
          aria-controls="mobile-drawer"
          onClick={() => setDrawerOpen((prev) => !prev)}
        >
          <span className={styles.hamburgerBar} />
          <span className={styles.hamburgerBar} />
          <span className={styles.hamburgerBar} />
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-drawer"
        className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ""}`}
        aria-hidden={!drawerOpen}
      >
        <nav aria-label="Principal">
          <ul className={styles.drawerList}>
            {role === "guest" ? (
              <li className={styles.drawerItem}>
                <Link
                  to="/login"
                  className={styles.drawerLoginAction}
                  onClick={closeDrawer}
                >
                  Iniciar sesión
                </Link>
              </li>
            ) : (
              <li className={`${styles.drawerItem} ${styles.drawerUserRow}`}>
                <span className={styles.drawerUserDisplayName}>{member!.display_name}</span>
                <button
                  type="button"
                  className={styles.drawerLogoutAction}
                  onClick={() => { handleLogout(); closeDrawer(); }}
                >
                  Cerrar sesión
                </button>
              </li>
            )}

            {status !== "error" &&
              items.map((item) => (
                <li key={item.href} className={styles.drawerItem}>
                  <a href={item.href} onClick={closeDrawer}>
                    {item.label}
                  </a>
                </li>
              ))}

            {/* Préstamos in drawer */}
            <li className={styles.drawerItem}>
              {hasPrestamosSubmenu ? (
                <>
                  <button
                    type="button"
                    className={styles.drawerParent}
                    aria-haspopup="menu"
                    aria-expanded={prestamosExpanded}
                    onClick={() => setPrestamosExpanded((prev) => !prev)}
                  >
                    Préstamos
                    <ChevronDown />
                  </button>
                  {prestamosExpanded && (
                    <PrestamosSubmenu
                      role={role}
                      adminExpanded={adminExpanded}
                      onToggleAdmin={() => setAdminExpanded((prev) => !prev)}
                      onItemClick={closeDrawer}
                    />
                  )}
                </>
              ) : (
                <Link to="/" onClick={closeDrawer}>
                  Préstamos
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
