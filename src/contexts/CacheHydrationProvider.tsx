/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CacheHydrationProvider
 *
 * Sits inside SyncProvider (so it can call useSync) and:
 *   1. On mount, triggers a single background sync check via the existing
 *      triggerSyncCheck from SyncContext — which compares timestamps and
 *      invalidates only stale queries.
 *   2. Clears the IDB cache on logout (when the token disappears).
 *
 * This component does NOT perform hydration itself — hydration already
 * happened synchronously before the first render in main.tsx. This component
 * only handles the post-mount initial sync trigger.
 *
 * The initial sync is non-blocking: it runs asynchronously and never delays
 * rendering.
 */

import React, { useEffect, useRef } from "react";
import { clearAllEntries } from "../cache/queryCache";
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
    if (!hasSyncedRef.current && isAuthenticated) {
      hasSyncedRef.current = true;
      void triggerSyncCheck();
    }
  }, [triggerSyncCheck, isAuthenticated]);

  useEffect(() => {
    if (prevAuthRef.current !== undefined) {
      if (prevAuthRef.current && !isAuthenticated) {
        // User logged out
        void clearAllEntries();
        hasSyncedRef.current = false;
      }
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  return <>{children}</>;
};
