import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
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
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { AdminMembersPage } from "./pages/AdminMembersPage";
import { AdminContentPage } from "./pages/AdminContentPage";
import { AdminBggPage } from "./pages/AdminBggPage";
import { RpgCatalogPage } from "./pages/RpgCatalogPage";
import { RpgDetailPage } from "./pages/RpgDetailPage";
import { ValidacionPage } from "./pages/ValidacionPage";
import { ProfilePage } from "./pages/ProfilePage";
import { EmailSupportPage } from "./pages/EmailSupportPage";

export default function App() {
  return (
    <BrowserRouter basename="/ludoteca">
      <AuthProvider>
        <CatalogModeProvider>
          <SiteNavProvider>
            <Routes>
              <Route
                path="/"
                element={<Navigate to="/juegos-de-mesa" replace />}
              />
              <Route
                path="/juegos-de-mesa"
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
                path="/juegos-de-rol"
                element={
                  <PageLayout>
                    <RpgCatalogPage />
                  </PageLayout>
                }
              />
              <Route
                path="/rol/:slug"
                element={
                  <PageLayout>
                    <RpgDetailPage />
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
                path="/profile"
                element={
                  <PageLayout>
                    <ProfilePage />
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
                path="/admin/bgg"
                element={
                  <PageLayout>
                    <AdminBggPage />
                  </PageLayout>
                }
              />
              <Route
                path="/validacion"
                element={
                  <PageLayout>
                    <ValidacionPage />
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
                path="/contacto-prestamos"
                element={
                  <PageLayout>
                    <EmailSupportPage />
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
              <Route
                path="/change-password"
                element={
                  <PageLayout>
                    <ChangePasswordPage />
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
