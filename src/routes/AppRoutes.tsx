/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '../layouts/MainLayout';
import { Spinner } from '../components/common/Spinner';

// Lazy load pages for performance
const LoginPage = lazy(() => import('../pages/Login/LoginPage').then(m => ({ default: m.LoginPage })));
const FoldersPage = lazy(() => import('../pages/Folders/FoldersPage').then(m => ({ default: m.FoldersPage })));

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center p-12">
    <Spinner label="A carregar..." />
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/folders" replace />} />
            <Route path="/songs" element={<FoldersPage />} />
            <Route path="/songs/:id" element={<FoldersPage />} />
            <Route path="/folders" element={<FoldersPage />} />
            <Route path="/services" element={<FoldersPage />} />
            <Route path="/services/:id" element={<FoldersPage />} />
            <Route path="/musicians" element={<FoldersPage />} />
            <Route path="/settings" element={<FoldersPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/folders" replace />} />
      </Routes>
    </Suspense>
  );
};
