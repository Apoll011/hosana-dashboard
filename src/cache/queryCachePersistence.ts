/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Attaches a single subscription to the React Query QueryCache that writes
 * successful query results to IndexedDB.
 *
 * Call attachQueryCachePersistence(queryClient) once, as early as possible
 * (before the first render). It returns an unsubscribe function.
 *
 * Only queries whose status transitions to "success" are written, ensuring we
 * never persist loading/error states or empty data.
 *
 * We deliberately avoid persisting:
 *   - Authentication data (tokens, passwords)
 *   - Queries with undefined/null data
 *
 * musicianTokens contains token values (bearer strings for musicians) so we
 * explicitly skip them.
 */

import { QueryClient } from "@tanstack/react-query";
import { persistEntry } from "./queryCache";

/** Query key prefixes that must NOT be persisted to IndexedDB. */
const SKIP_PREFIXES: string[] = [
  // Musician tokens are access credentials; skip them.
  '["musicianTokens"',
  // Admins-pending has short-lived invite metadata — skip to avoid stale
  // invite-state being shown offline. The base ["admins"] list IS persisted.
  '["admins","pending"',
];

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
