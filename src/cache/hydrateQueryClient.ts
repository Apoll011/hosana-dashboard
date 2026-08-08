/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Reads all persisted cache entries from IndexedDB and injects them into the
 * given QueryClient via setQueryData — making them immediately available to
 * useQuery hooks without a network round-trip.
 *
 * This function is designed to be called ONCE, before the first React render,
 * so the hydrated data is already in-cache when components mount.
 *
 * Entries are injected with updatedAt preserved as the query's data updatedAt
 * field so that React Query's staleTime logic still applies normally.
 *
 * A failed IDB read (private browsing, quota, etc.) is silently swallowed —
 * the application continues with an empty cache and fetches from the network
 * as usual.
 */

import { QueryClient } from "@tanstack/react-query";
import { readAllEntries } from "./queryCache";

export async function hydrateQueryClientFromIDB(
  queryClient: QueryClient,
): Promise<void> {
  try {
    const entries = await readAllEntries();

    for (const [serializedKey, entry] of entries) {
      try {
        const queryKey = JSON.parse(serializedKey) as readonly unknown[];
        // Only set if the cache doesn't already have fresh data for this key
        // (in practice there won't be any on cold start, but guards re-runs).
        const existing = queryClient.getQueryData(queryKey);
        if (existing === undefined) {
          queryClient.setQueryData(queryKey, entry.data, {
            updatedAt: entry.updatedAt,
          });
        }
      } catch {
        // Skip malformed keys — they won't be written again unless fixed.
      }
    }
  } catch {
    // IDB unavailable — application continues without cached data.
  }
}
