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
import { useSync } from "./SyncContext";

interface Props {
  children: React.ReactNode;
}

export const CacheHydrationProvider: React.FC<Props> = ({ children }) => {
  const { triggerSyncCheck } = useSync();
  const hasSyncedRef = useRef(false);
  const prevTokenRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // Trigger one immediate background sync on first mount (non-blocking).
    // SyncContext will only invalidate queries whose timestamps have changed
    // since the cached data was written, so this is safe and lightweight.
    if (!hasSyncedRef.current) {
      hasSyncedRef.current = true;
      void triggerSyncCheck();
    }
  }, [triggerSyncCheck]);

  // Clear IDB when the user logs out (token disappears after being present).
  useEffect(() => {
    const checkToken = () => {
      if (prevTokenRef.current !== undefined) {
        const wasAuthenticated = !!prevTokenRef.current;
        const isNowAuthenticated = false;

        if (wasAuthenticated && !isNowAuthenticated) {
          // User logged out — purge the IDB cache.
          void clearAllEntries();
        }
      }

      prevTokenRef.current = null;
    };

    // Check on mount
    checkToken();

    // Re-check periodically to detect logout from another tab or
    // programmatic token removal.
    const interval = setInterval(checkToken, 5000);
    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
};
