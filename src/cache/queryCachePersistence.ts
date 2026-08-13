/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryClient } from "@tanstack/react-query";
import { persistEntry } from "./queryCache";

const SKIP_PREFIXES: string[] = [];

function shouldSkip(serializedKey: string): boolean {
  return SKIP_PREFIXES.some((prefix) => serializedKey.startsWith(prefix));
}

/**
 * Subscribe to query cache events and persist successful results.
 * Returns an unsubscribe callback.
 */
export function attachQueryCachePersistence(
  queryClient: QueryClient,
): () => void {
  const queryCache = queryClient.getQueryCache();

  const unsubscribe = queryCache.subscribe((event) => {
    // We only care about queries that have just moved to "success"
    if (event.type !== "updated") return;
    const query = event.query;
    if (query.state.status !== "success") return;
    if (query.state.data === undefined || query.state.data === null) return;

    const serialized = JSON.stringify(query.queryKey);
    if (shouldSkip(serialized)) return;

    // Fire-and-forget — we never await this in the event handler
    void persistEntry(query.queryKey, query.state.data);
  });

  return unsubscribe;
}
