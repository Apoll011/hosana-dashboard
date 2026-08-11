/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Spinner } from "@hosanna/shared";
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, tenant } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-m3-bg">
        <Spinner size="lg" label="A autenticar sessão no Servidor Hosanna..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated but has no tenant, redirect to onboarding
  // unless they are already on the onboarding page
  if (!tenant && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // If they have a tenant but try to access onboarding or root, send them to the app with tenant slug
  if (tenant && (location.pathname === "/onboarding" || location.pathname === "/")) {
    return <Navigate to={`/${tenant.slug}/folders`} replace />;
  }

  return <Outlet />;
};
