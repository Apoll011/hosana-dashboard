/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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
