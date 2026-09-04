/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import { getDatabase } from "../db";
import { isDemoMode } from "../demo/index";
import { useAuth } from "./AuthContext";
import { useSync } from "./SyncContext";

interface Props {
  children: React.ReactNode;
}

export const CacheHydrationProvider: React.FC<Props> = ({ children }) => {
  const { triggerSyncCheck } = useSync();
  const { isAuthenticated } = useAuth();
  const hasSyncedRef = useRef(false);
  const prevAuthRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    // Demo mode — DemoPage is the sole seeder (runs before the hard navigation).
    // CacheHydrationProvider must not seed here to avoid a race condition where
    // generateDemoData() is called twice with fresh UUIDs, duplicating all docs.
    if (isDemoMode()) return;

    if (!hasSyncedRef.current && isAuthenticated) {
      hasSyncedRef.current = true;
      void triggerSyncCheck();
    }
  }, [triggerSyncCheck, isAuthenticated]);

  useEffect(() => {
    if (isDemoMode()) return; // Demo data is ephemeral — never clear on "logout"

    if (prevAuthRef.current !== undefined) {
      if (prevAuthRef.current && !isAuthenticated) {
        // User logged out — clear all RxDB collections
        void (async () => {
          try {
            const db = await getDatabase();
            await Promise.all([
              db.songs.remove(),
              db.folders.remove(),
              db.services.remove(),
            ]);
          } catch {
            // ignore — DB may not be initialized yet
          }
        })();
        hasSyncedRef.current = false;
      }
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  return <>{children}</>;
};
