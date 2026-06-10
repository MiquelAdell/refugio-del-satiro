import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CatalogModeProvider } from "./context/CatalogModeContext";
import { SiteNavProvider } from "./context/SiteNavProvider";
import { PageLayout } from "./components/PageLayout";
import { CatalogPage } from "./pages/CatalogPage";
import { GameDetailPage } from "./pages/GameDetailPage";
import { MyLoansPage } from "./pages/MyLoansPage";
import { LoginPage } from "./pages/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { SetPasswordPage } from "./pages/SetPasswordPage";
import { AdminMembersPage } from "./pages/AdminMembersPage";
import { AdminContentPage } from "./pages/AdminContentPage";

// The same SPA bundle serves two basenames: the authenticated member app at
// /prestamos and the public read-only catalog at /ludoteca. The basename is
// decided once at boot from the URL the document was served under.
const GUEST_BASENAME = "/ludoteca";

function isGuestMode(): boolean {
  return window.location.pathname.startsWith(GUEST_BASENAME);
}

function GuestApp() {
  return (
    <BrowserRouter basename={GUEST_BASENAME}>
      <AuthProvider>
        <CatalogModeProvider isGuest={true}>
          <SiteNavProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <PageLayout>
                    <CatalogPage />
                  </PageLayout>
                }
              />
              <Route
                path="/juegos/:slug"
                element={
                  <PageLayout>
                    <GameDetailPage />
                  </PageLayout>
                }
              />
            </Routes>
          </SiteNavProvider>
        </CatalogModeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function MemberApp() {
  return (
    <BrowserRouter basename="/prestamos">
      <AuthProvider>
        <CatalogModeProvider isGuest={false}>
          <SiteNavProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <PageLayout>
                    <CatalogPage />
                  </PageLayout>
                }
              />
              <Route
                path="/juegos/:slug"
                element={
                  <PageLayout>
                    <GameDetailPage />
                  </PageLayout>
                }
              />
              <Route
                path="/my-loans"
                element={
                  <PageLayout>
                    <MyLoansPage />
                  </PageLayout>
                }
              />
              <Route
                path="/admin/members"
                element={
                  <PageLayout>
                    <AdminMembersPage />
                  </PageLayout>
                }
              />
              <Route
                path="/admin/content"
                element={
                  <PageLayout>
                    <AdminContentPage />
                  </PageLayout>
                }
              />
              <Route
                path="/login"
                element={
                  <PageLayout>
                    <LoginPage />
                  </PageLayout>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PageLayout>
                    <ForgotPasswordPage />
                  </PageLayout>
                }
              />
              <Route
                path="/set-password"
                element={
                  <PageLayout>
                    <SetPasswordPage />
                  </PageLayout>
                }
              />
            </Routes>
          </SiteNavProvider>
        </CatalogModeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default function App() {
  return isGuestMode() ? <GuestApp /> : <MemberApp />;
}
