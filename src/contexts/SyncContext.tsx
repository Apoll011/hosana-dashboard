/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useQueryClient } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { httpClient } from "../api/client";
import { syncApi } from "../api/sync";
import { SyncStatus } from "../types";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  text: string;
}

interface SyncContextType {
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
  toasts: ToastMessage[];
  showToast: (text: string, type?: ToastMessage["type"]) => void;
  removeToast: (id: string) => void;
  triggerSyncCheck: () => Promise<void>;
  lastSyncedAt: Date | null;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const lastTimestampsRef = useRef<Record<string, string>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (text: string, type: ToastMessage["type"] = "info") => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, text }]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast],
  );

  const triggerSyncCheck = useCallback(async () => {
    const token = httpClient.getToken();
    if (!token) return;

    try {
      setSyncStatus("syncing");
      const data = await syncApi.getStatus();
      setLastSyncedAt(new Date(data.timestamp));

      const prev = lastTimestampsRef.current;
      const curr = data.timestamps;

      if (Object.keys(prev).length > 0) {
        if (curr.songs && curr.songs !== prev.songs) {
          queryClient.invalidateQueries({ queryKey: ["songs"] });
        }
        if (curr.folders && curr.folders !== prev.folders) {
          queryClient.invalidateQueries({ queryKey: ["folders"] });
        }
        if (curr.services && curr.services !== prev.services) {
          queryClient.invalidateQueries({ queryKey: ["services"] });
        }
        if (curr.musicians && curr.musicians !== prev.musicians) {
          queryClient.invalidateQueries({ queryKey: ["musicians"] });
        }
        if (curr.settings && curr.settings !== prev.settings) {
          queryClient.invalidateQueries({ queryKey: ["settings"] });
        }
        if (curr.admins && curr.admins !== prev.admins) {
          queryClient.invalidateQueries({ queryKey: ["admins"] });
        }
      }

      lastTimestampsRef.current = curr;
      setSyncStatus("synced");
    } catch {
      // Endpoint may not be present or network temporary error
      setSyncStatus("synced");
    }
  }, [queryClient]);

  // Periodic lightweight poll for background changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (httpClient.getToken()) {
        triggerSyncCheck();
      }
    }, 15000); // 15 seconds poll for fast & lightweight sync check

    const handleFocus = () => {
      if (httpClient.getToken()) {
        triggerSyncCheck();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [triggerSyncCheck]);

  return (
    <SyncContext.Provider
      value={{
        syncStatus,
        setSyncStatus,
        toasts,
        showToast,
        removeToast,
        triggerSyncCheck,
        lastSyncedAt,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
};
