/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '../layouts/MainLayout';
import { Spinner } from '../components/common/Spinner';

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center p-12">
    <Spinner label="A carregar..." />
  </div>
);


const lazyImport = (componentImport: () => Promise<any>) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.localStorage.getItem('page-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.localStorage.setItem('page-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.localStorage.setItem('page-force-refreshed', 'true');
        window.location.reload();
        return { default: () => <PageLoader/> }; 
      }
      throw error;
    }
  });


const ErrorFallback = ({ resetErrorBoundary }: { resetErrorBoundary: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
    <h2 className="text-xl font-bold mb-2">Ups! Ligação perdida.</h2>
    <p className="text-gray-500 mb-4">
      Não foi possível carregar esta página. Por favor, verifique a sua ligação à internet.
    </p>
    <button 
      onClick={resetErrorBoundary} 
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Tentar Novamente
    </button>
  </div>
);

const LoginPage = lazyImport(() => import('../pages/Login/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazyImport(() => import('../pages/Register/RegisterPage').then(m => ({ default: m.RegisterPage })));
const RegisterTenantPage = lazyImport(() => import('../pages/Register/Tenant').then(m => ({ default: m.RegisterTenantPage })));
const FoldersPage = lazyImport(() => import('../pages/Folders/FoldersPage').then(m => ({ default: m.FoldersPage })));
const SongsPage = lazyImport(() => import('../pages/Songs/SongsPage').then(m => ({ default: m.SongsPage })));
const SongEditorPage = lazyImport(() => import('../pages/Songs/SongEditorPage').then(m => ({ default: m.SongEditorPage })));
const ServicesPage = lazyImport(() => import('../pages/Services/ServicesPage').then(m => ({ default: m.ServicesPage })));
const ServiceDetailPage = lazyImport(() => import('../pages/Services/ServiceDetailPage').then(m => ({ default: m.ServiceDetailPage })));
const MusiciansPage = lazyImport(() => import('../pages/Musicians/MusiciansPage').then(m => ({ default: m.MusiciansPage })));
const SettingsPage = lazyImport(() => import('../pages/Settings/SettingsPage').then(m => ({ default: m.SettingsPage })));


export const AppRoutes: React.FC = () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/new" element={<RegisterTenantPage />} />

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
    </ErrorBoundary>
  );
};