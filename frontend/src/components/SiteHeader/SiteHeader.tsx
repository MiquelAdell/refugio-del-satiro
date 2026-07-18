import { useEffect, useRef, useState } from "react";
import { Link, useMatch } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCatalogMode } from "../../context/CatalogModeContext";
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

// ─── User menu config ─────────────────────────────────────────────────────────

interface AdminSubmenuLink {
  readonly label: string;
  readonly to: string;
}

// `to` values are router-relative (inside `<BrowserRouter basename="/ludoteca">`),
// so they omit the `/ludoteca` prefix — the router prepends it.
const ADMIN_SUBMENU: readonly AdminSubmenuLink[] = [
  { label: "Miembros", to: "/admin/members" },
  { label: "Contenido GSite", to: "/admin/content" },
  { label: "Datos BGG", to: "/admin/bgg" },
];

// ─── AdminNestedSubmenu ───────────────────────────────────────────────────────

interface AdminNestedSubmenuProps {
  readonly mobileExpanded: boolean;
  readonly onToggleMobile: () => void;
  readonly onItemClick?: () => void;
}

function AdminNestedSubmenu({
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
        Administración
        <ChevronDown />
      </button>
      <ul
        className={`${styles.nestedList} ${mobileExpanded ? styles.nestedListOpen : ""}`}
        role="menu"
      >
        {ADMIN_SUBMENU.map((child) => (
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

// ─── UserSubmenu (shared: desktop dropdown + drawer section) ─────────────────

interface UserSubmenuProps {
  readonly isAdmin: boolean;
  readonly adminExpanded: boolean;
  readonly onToggleAdmin: () => void;
  readonly onLogout: () => void;
  readonly onItemClick?: () => void;
  readonly alignRight?: boolean;
}

function UserSubmenu({
  isAdmin,
  adminExpanded,
  onToggleAdmin,
  onLogout,
  onItemClick,
  alignRight = false,
}: UserSubmenuProps) {
  return (
    <ul
      className={`${styles.submenu} ${alignRight ? styles.submenuRight : ""}`}
      role="menu"
    >
      <li className={styles.submenuItem} role="menuitem">
        <Link to="/profile" onClick={onItemClick}>
          Mi perfil
        </Link>
      </li>
      <li className={styles.submenuItem} role="menuitem">
        <Link to="/my-loans" onClick={onItemClick}>
          Mis préstamos
        </Link>
      </li>
      {isAdmin && (
        <AdminNestedSubmenu
          mobileExpanded={adminExpanded}
          onToggleMobile={onToggleAdmin}
          onItemClick={onItemClick}
        />
      )}
      <li className={`${styles.submenuItem} ${styles.logoutItem}`} role="menuitem">
        <button
          type="button"
          className={styles.submenuButton}
          onClick={() => {
            onLogout();
            onItemClick?.();
          }}
        >
          Cerrar sesión
        </button>
      </li>
    </ul>
  );
}

// ─── SiteHeader ──────────────────────────────────────────────────────────────

export function SiteHeader() {
  const { items, status } = useNavItemsContext();
  const { member, logout } = useAuth();
  const { isGuest } = useCatalogMode();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedDrawerHref, setExpandedDrawerHref] = useState<string | null>(null);
  const [userExpanded, setUserExpanded] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);


  const isLoginRoute = Boolean(useMatch("/login"));

  // isGuest is derived from auth state via CatalogModeContext.
  const isLoggedIn = !isGuest && member !== null;
  const isAdmin = isLoggedIn && member.is_admin === true;

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
    setExpandedDrawerHref(null);
    setUserExpanded(false);
    setAdminExpanded(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Logo */}
        <a href="/inicio" className={styles.logoLink} aria-label="Refugio del Sátiro – Inicio">
          <img
            src="/ludoteca/branding/logo.png"
            alt=""
            className={styles.logo}
            height="40"
          />
          <span className={styles.logoText}>El Refugio del Sátiro</span>
        </a>

        {/* Desktop nav */}
        <nav className={styles.desktopNav} aria-label="Principal">
          <ul className={styles.navList}>
            {status !== "error" &&
              items.map((item) => {
                // "/inicio" 301-redirects to "/", so the home nav item must
                // also match the bare root path.
                const isActive =
                  typeof window !== "undefined" &&
                  (window.location.pathname.startsWith(item.href) ||
                    (item.href === "/inicio" && window.location.pathname === "/"));
                const hasChildren =
                  item.children !== undefined && item.children.length > 0;
                return (
                  <li
                    key={item.href}
                    className={`${styles.navItem} ${hasChildren ? styles.hasSubmenu : ""} ${isActive ? styles.active : ""}`}
                  >
                    <a href={item.href} aria-haspopup={hasChildren ? "menu" : undefined}>
                      {item.label}
                      {hasChildren && <ChevronDown />}
                    </a>
                    {hasChildren && (
                      <ul className={styles.submenu} role="menu">
                        {item.children!.map((child) => (
                          <li key={child.href} className={styles.submenuItem} role="menuitem">
                            <a href={child.href}>{child.label}</a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
          </ul>
        </nav>

        {/* Right-side actions */}
        <div className={styles.headerActions}>
          {!isLoggedIn ? (
            !isLoginRoute && (
              <Link to="/login" className={styles.loginAction}>
                Iniciar sesión
              </Link>
            )
          ) : (
            <div className={`${styles.userMenu} ${styles.hasSubmenu}`}>
              <button
                type="button"
                className={styles.userMenuTrigger}
                aria-haspopup="menu"
              >
                <span className={styles.userMenuName}>{member.display_name}</span>
                <ChevronDown />
              </button>
              <UserSubmenu
                isAdmin={isAdmin}
                adminExpanded={false}
                onToggleAdmin={() => undefined}
                onLogout={handleLogout}
                alignRight
              />
            </div>
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
            {!isLoggedIn ? (
              !isLoginRoute && (
                <li className={styles.drawerItem}>
                  <Link
                    to="/login"
                    className={styles.drawerLoginAction}
                    onClick={closeDrawer}
                  >
                    Iniciar sesión
                  </Link>
                </li>
              )
            ) : (
              <li className={styles.drawerItem}>
                <button
                  type="button"
                  className={styles.drawerParent}
                  aria-haspopup="menu"
                  aria-expanded={userExpanded}
                  onClick={() => setUserExpanded((prev) => !prev)}
                >
                  {member.display_name}
                  <ChevronDown />
                </button>
                {userExpanded && (
                  <UserSubmenu
                    isAdmin={isAdmin}
                    adminExpanded={adminExpanded}
                    onToggleAdmin={() => setAdminExpanded((prev) => !prev)}
                    onLogout={handleLogout}
                    onItemClick={closeDrawer}
                  />
                )}
              </li>
            )}

            {status !== "error" &&
              items.map((item) => {
                const hasChildren =
                  item.children !== undefined && item.children.length > 0;
                const isExpanded = expandedDrawerHref === item.href;
                return (
                  <li key={item.href} className={styles.drawerItem}>
                    {hasChildren ? (
                      <>
                        <button
                          type="button"
                          className={styles.drawerParent}
                          aria-haspopup="menu"
                          aria-expanded={isExpanded}
                          onClick={() =>
                            setExpandedDrawerHref(isExpanded ? null : item.href)
                          }
                        >
                          {item.label}
                          <ChevronDown />
                        </button>
                        {isExpanded && (
                          <ul className={styles.submenu} role="menu">
                            {item.children!.map((child) => (
                              <li key={child.href} className={styles.submenuItem} role="menuitem">
                                <a href={child.href} onClick={closeDrawer}>
                                  {child.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <a href={item.href} onClick={closeDrawer}>
                        {item.label}
                      </a>
                    )}
                  </li>
                );
              })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
