import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import "./tokens.css";
import "./site-shell-embed.css";
import { AuthProvider } from "./context/AuthContext";
import { CatalogModeProvider } from "./context/CatalogModeContext";
import { SiteNavProvider } from "./context/SiteNavProvider";
import { SiteHeader } from "./components/SiteHeader/SiteHeader";

const rootEl = document.getElementById("site-shell-root");
if (rootEl) {
  // On static content-mirror pages there is no React Router handling navigation,
  // so any anchor click inside the shell must trigger a real full-page load.
  // Intercept in the capture phase (before React's synthetic event handlers).
  rootEl.addEventListener(
    "click",
    (e) => {
      const anchor = (e.target as Element).closest("a[href]");
      if (
        anchor instanceof HTMLAnchorElement &&
        !anchor.getAttribute("href")?.startsWith("#")
      ) {
        e.preventDefault();
        window.location.href = anchor.href;
      }
    },
    true,
  );

  // MemoryRouter instead of BrowserRouter: the embed runs on static pages
  // (e.g. /calendario/) whose URLs don't start with the /ludoteca basename.
  // React Router v7's BrowserRouter refuses to render in that situation.
  // MemoryRouter ignores the actual URL, so the Router always renders, and
  // basename="/ludoteca" still makes <Link> hrefs resolve to /ludoteca/….
  // Navigation is handled by the capture-phase click listener above anyway.
  createRoot(rootEl).render(
    <StrictMode>
      <MemoryRouter basename="/ludoteca" initialEntries={["/ludoteca/"]}>
        <AuthProvider>
          <CatalogModeProvider>
            <SiteNavProvider>
              <SiteHeader />
            </SiteNavProvider>
          </CatalogModeProvider>
        </AuthProvider>
      </MemoryRouter>
    </StrictMode>,
  );
}
