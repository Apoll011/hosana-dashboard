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
const SongsPage = lazy(() => import('../pages/Songs/SongsPage').then(m => ({ default: m.SongsPage })));
const SongEditorPage = lazy(() => import('../pages/Songs/SongEditorPage').then(m => ({ default: m.SongEditorPage })));
const ServicesPage = lazy(() => import('../pages/Services/ServicesPage').then(m => ({ default: m.ServicesPage })));
const ServiceDetailPage = lazy(() => import('../pages/Services/ServiceDetailPage').then(m => ({ default: m.ServiceDetailPage })));
const MusiciansPage = lazy(() => import('../pages/Musicians/MusiciansPage').then(m => ({ default: m.MusiciansPage })));
const SettingsPage = lazy(() => import('../pages/Settings/SettingsPage').then(m => ({ default: m.SettingsPage })));

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
            <Route path="/folders" element={<FoldersPage />} />
            <Route path="/songs" element={<SongsPage hideHeader />} />
            <Route path="/songs/:id" element={<SongEditorPage />} />
            <Route path="/services" element={<ServicesPage hideHeader />} />
            <Route path="/services/:id" element={<ServiceDetailPage />} />
            <Route path="/musicians" element={<MusiciansPage hideHeader />} />
            <Route path="/settings" element={<SettingsPage hideHeader />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/folders" replace />} />
      </Routes>
    </Suspense>
  );
};
