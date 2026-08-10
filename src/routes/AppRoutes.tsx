/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Spinner } from "@hosanna/shared";
import React, { Suspense, lazy } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { OnboardingPage } from "../pages/OnboardingPage";

const PageLoader = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-m3-bg">
    <Spinner size="lg" label="A carregar..." />
  </div>
);

const lazyImport = (componentImport: () => Promise<any>) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.localStorage.getItem("page-force-refreshed") || "false",
    );

    try {
      const component = await componentImport();
      window.localStorage.setItem("page-force-refreshed", "false");
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.localStorage.setItem("page-force-refreshed", "true");
        window.location.reload();
        return { default: () => <PageLoader /> };
      }
      throw error;
    }
  });

const ErrorFallback = ({
  resetErrorBoundary,
}: {
  resetErrorBoundary: () => void;
}) => (
  <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
    <h2 className="text-xl font-bold mb-2">Ups! Ligação perdida.</h2>
    <p className="text-gray-500 mb-4">
      Não foi possível carregar esta página. Por favor, verifique a sua ligação
      à internet.
    </p>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Tentar Novamente
    </button>
  </div>
);

const LoginPage = lazyImport(() =>
  import("../pages/Login/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazyImport(() =>
  import("../pages/Login/RegisterPage").then((m) => ({
    default: m.RegisterPage,
  })),
);
const RegisterTenantPage = lazyImport(() =>
  import("../pages/Login/Tenant").then((m) => ({
    default: m.RegisterTenantPage,
  })),
);
const VerifyEmailPage = lazyImport(() =>
  import("../pages/Login/VerifyEmailPage").then((m) => ({
    default: m.VerifyEmailPage,
  })),
);
const ForgotPasswordPage = lazyImport(() =>
  import("../pages/Login/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazyImport(() =>
  import("../pages/Login/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const FoldersPage = lazyImport(() =>
  import("../pages/FoldersPage").then((m) => ({
    default: m.FoldersPage,
  })),
);
const SongsPage = lazyImport(() =>
  import("../pages/Songs/SongsPage").then((m) => ({ default: m.SongsPage })),
);
const SongEditorPage = lazyImport(() =>
  import("../pages/Songs/SongEditorPage").then((m) => ({
    default: m.SongEditorPage,
  })),
);
const ServicesPage = lazyImport(() =>
  import("../pages/Services/ServicesPage").then((m) => ({
    default: m.ServicesPage,
  })),
);
const ServiceDetailPage = lazyImport(() =>
  import("../pages/Services/ServiceDetailPage").then((m) => ({
    default: m.ServiceDetailPage,
  })),
);
const SettingsPage = lazyImport(() =>
  import("../pages/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  })),
);

export const AppRoutes: React.FC = () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/new" element={<RegisterTenantPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/folders" replace />} />
              <Route path="/folders" element={<FoldersPage />} />
              <Route path="/songs" element={<SongsPage hideHeader />} />
              <Route path="/songs/:id" element={<SongEditorPage />} />
              <Route path="/services" element={<ServicesPage hideHeader />} />
              <Route path="/services/:id" element={<ServiceDetailPage />} />
              <Route path="/settings" element={<SettingsPage hideHeader />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/folders" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};
