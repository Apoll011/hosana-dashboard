/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { SyncStatus } from '../types';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
}

interface SyncContextType {
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
  toasts: ToastMessage[];
  showToast: (text: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { id, type, text }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <SyncContext.Provider
      value={{
        syncStatus,
        setSyncStatus,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
