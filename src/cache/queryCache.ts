/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Thin IndexedDB wrapper that persists React Query cache entries.
 *
 * Design decisions:
 * - One object store ("queries") keyed by the serialised queryKey.
 * - Each record stores { data, updatedAt } so we can skip stale writes.
 * - All operations are fire-and-forget from the call-site perspective; errors
 *   are swallowed so a broken IDB never breaks the application.
 * - No TTL is enforced here — the existing React Query staleTime / the 15-s
 *   sync cycle are the source of truth for freshness.
 */

const DB_NAME = "hosana-query-cache";
const DB_VERSION = 1;
const STORE = "queries";

// Query keys that contain secrets or are unsafe to persist.
const BLOCKED_KEY_PREFIXES: string[] = [
  // auth tokens, credentials etc. are never stored in React Query so this
  // list is precautionary; extend as needed.
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function serializeKey(queryKey: readonly unknown[]): string {
  return JSON.stringify(queryKey);
}

function isSafe(serializedKey: string): boolean {
  return !BLOCKED_KEY_PREFIXES.some((prefix) =>
    serializedKey.startsWith(prefix),
  );
}

// ── DB singleton ─────────────────────────────────────────────────────────────

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE); // keyed by the serialised queryKey string
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null; // allow retry on next call
      reject(request.error);
    };
  });

  return dbPromise;
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface CacheEntry {
  data: unknown;
  updatedAt: number; // Date.now()
}

/**
 * Persist a single query entry. Silently ignores blocked keys and errors.
 */
export async function persistEntry(
  queryKey: readonly unknown[],
  data: unknown,
): Promise<void> {
  try {
    const key = serializeKey(queryKey);
    if (!isSafe(key)) return;

    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const entry: CacheEntry = { data, updatedAt: Date.now() };
    store.put(entry, key);
    // No need to await tx.oncomplete — fire-and-forget
  } catch {
    // IDB unavailable (private browsing, storage quota, etc.) — ignore
  }
}

/**
 * Read all persisted cache entries as a Map of key -> CacheEntry.
 * Returns an empty Map on any error.
 */
export async function readAllEntries(): Promise<Map<string, CacheEntry>> {
  const result = new Map<string, CacheEntry>();
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);

    await new Promise<void>((resolve, reject) => {
      const req = store.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) {
          resolve();
          return;
        }
        result.set(cursor.key as string, cursor.value as CacheEntry);
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Return whatever we managed to collect (or empty Map)
  }
  return result;
}

/**
 * Remove a single entry (e.g. after a user logs out).
 */
export async function removeEntry(queryKey: readonly unknown[]): Promise<void> {
  try {
    const key = serializeKey(queryKey);
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
  } catch {
    // ignore
  }
}

/**
 * Wipe the entire cache store (e.g. on logout).
 */
export async function clearAllEntries(): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
  } catch {
    // ignore
  }
}
