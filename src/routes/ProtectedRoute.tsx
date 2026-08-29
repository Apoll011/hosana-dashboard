/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Spinner } from "@/src/components/common";
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useI18n } from "../i18n";

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, organization } = useAuth();
  const location = useLocation();
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-m3-bg">
        <Spinner size="lg" label={t("common.loading")} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated but has no organization, redirect to onboarding
  // unless they are already on the onboarding page
  if (!organization && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // If they have a organization but try to access onboarding or root, send them to the app with organization slug
  if (
    organization &&
    (location.pathname === "/onboarding" || location.pathname === "/")
  ) {
    return <Navigate to={`/${organization.slug}/folders`} replace />;
  }

  return <Outlet />;
};
