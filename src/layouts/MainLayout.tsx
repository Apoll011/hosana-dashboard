/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { ToastContainer } from '../components/common/Toast';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-screen bg-[#f8fafc] dark:bg-slate-950 text-[#1D1B20] dark:text-slate-100 font-sans overflow-hidden">
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50/50 dark:bg-slate-950">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  );
};
