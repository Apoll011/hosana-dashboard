/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Spinner } from "@hosanna/shared";
import React, { Suspense, lazy, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../layouts/MainLayout";
import { usePreloadPermissions } from "../lib/permissions/client";
import { OnboardingPage } from "../pages/OnboardingPage";
import { ProtectedRoute } from "./ProtectedRoute";

const PageLoader = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-m3-bg">
    <Spinner size="lg" label="A carregar..." />
  </div>
);

type LazyImportFn<T> = () => Promise<{ default: React.ComponentType<T> }>;

const prefetchQueue: Array<() => Promise<unknown>> = [];

const lazyImport = <T,>(componentImport: LazyImportFn<T>) => {
  prefetchQueue.push(componentImport);

  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.localStorage.getItem("page-force-refreshed") || "false",
    );

    try {
      const component = await componentImport();
      if (pageHasAlreadyBeenForceRefreshed) {
        window.localStorage.setItem("page-force-refreshed", "false");
      }
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
};

function canPrefetch(): boolean {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as any).connection;
  if (!connection) return true;
  if (connection.saveData) return false;
  return !["slow-2g", "2g"].includes(connection.effectiveType);
}

function runWhenIdle(cb: () => void, timeout = 2000) {
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(cb, { timeout });
  } else {
    setTimeout(cb, 1);
  }
}

function prefetchRemainingRoutes() {
  if (!canPrefetch()) return;

  let i = 0;
  const step = () => {
    if (i >= prefetchQueue.length) return;
    const importFn = prefetchQueue[i++];
    importFn().catch(() => {});
    runWhenIdle(step);
  };

  runWhenIdle(step);
}

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

const OrganizationGuard = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { organization, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  if (!organization) {
    return <Navigate to="/onboarding" replace />;
  }

  if (slug && slug !== organization.slug) {
    const correctPathname = location.pathname.replace(
      new RegExp(`^/${slug}`),
      `/${organization.slug}`,
    );

    return (
      <Navigate
        to={`${correctPathname}${location.search}${location.hash}`}
        replace
      />
    );
  }

  return <Outlet />;
};

// ----------------------------------------------------------------------
// LAZY IMPORTS
// ----------------------------------------------------------------------
const LoginPage = lazyImport(() =>
  import("../pages/Login/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const TwoFactorPage = lazyImport(() =>
  import("../pages/Login/TwoFactorPage").then((m) => ({
    default: m.TwoFactorPage,
  })),
);
const RegisterPage = lazyImport(() =>
  import("../pages/Login/RegisterPage").then((m) => ({
    default: m.RegisterPage,
  })),
);
const RegisterOrganizationPage = lazyImport(() =>
  import("../pages/Login/Tenant").then((m) => ({
    default: m.RegisterOrganizationPage,
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
const AcceptInvitationPage = lazyImport(() =>
  import("../pages/Login/AcceptInvitationPage").then((m) => ({
    default: m.AcceptInvitationPage,
  })),
);
const FoldersPage = lazyImport(() =>
  import("../pages/FoldersPage").then((m) => ({ default: m.FoldersPage })),
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
  import("../pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const TeamsPage = lazyImport(() =>
  import("../pages/TeamsPage").then((m) => ({ default: m.TeamsPage })),
);

export const AppRoutes: React.FC = () => {
  usePreloadPermissions();

  useEffect(() => {
    prefetchRemainingRoutes();
  }, []);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/two-factor" element={<TwoFactorPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/new" element={<RegisterOrganizationPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/accept-invitation" element={<AcceptInvitationPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* Wrap the slug routes with our new OrganizationGuard */}
            <Route path="/:slug" element={<OrganizationGuard />}>
              <Route element={<MainLayout />}>
                <Route index element={<Navigate to="folders" replace />} />
                <Route path="folders" element={<FoldersPage />} />
                <Route path="songs" element={<SongsPage hideHeader />} />
                <Route path="songs/:id" element={<SongEditorPage />} />
                <Route path="services" element={<ServicesPage hideHeader />} />
                <Route path="services/:id" element={<ServiceDetailPage />} />
                <Route path="teams" element={<TeamsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};
