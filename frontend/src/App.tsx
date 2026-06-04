import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SiteNavProvider } from "./context/SiteNavProvider";
import { PageLayout } from "./components/PageLayout";
import { MinimalPageLayout } from "./components/MinimalPageLayout";
import { CatalogPage } from "./pages/CatalogPage";
import { GameDetailPage } from "./pages/GameDetailPage";
import { MyLoansPage } from "./pages/MyLoansPage";
import { LoginPage } from "./pages/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { SetPasswordPage } from "./pages/SetPasswordPage";
import { AdminMembersPage } from "./pages/AdminMembersPage";
import { AdminContentPage } from "./pages/AdminContentPage";

export default function App() {
  return (
    <BrowserRouter basename="/prestamos">
      <AuthProvider>
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
                <MinimalPageLayout>
                  <LoginPage />
                </MinimalPageLayout>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <MinimalPageLayout>
                  <ForgotPasswordPage />
                </MinimalPageLayout>
              }
            />
            <Route
              path="/set-password"
              element={
                <MinimalPageLayout>
                  <SetPasswordPage />
                </MinimalPageLayout>
              }
            />
          </Routes>
        </SiteNavProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
