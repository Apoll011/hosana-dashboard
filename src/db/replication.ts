/**
 * Hosana HTTP Replication — replaces rxdb/plugins/replication.
 *
 * The server-side HTTP pull/push protocol (endpoints, payloads, checkpoint
 * shape) is completely unchanged. Only the client-side driver that
 * communicates between the server and the local store is rewritten here.
 *
 * Replication strategy:
 *  1. Push FIRST: POST /replication/<collection>/push with locally
 *     changed/deleted docs since last checkpoint. Sends only changed fields
 *     in both newDocumentState and assumedMasterState (id + updatedAt + delta).
 *     Soft-delete (`isDeleted`) is a normal field — NOT the `_deleted` tombstone.
 *  2. Pull: POST /replication/<collection>/pull with the last checkpoint.
 *     Documents are merged into the local store using `_mergeBatchFromServer()`,
 *     which preserves local-only fields and re-runs computed fields.
 *     Deleted docs (server tombstones) are removed from the local store.
 *  3. Conflict resolution: spurious conflicts (volatile-field drift only) are
 *     auto-retried; real content conflicts surface as server docs.
 *  4. FK ordering: services always pushed/pulled before agendaEvents.
 *
 * Checkpoint resilience:
 *  - Checkpoints are saved in BOTH localStorage AND a dedicated IndexedDB store
 *    ("repl_checkpoints"). On startup the IDB copy is preferred (it survives
 *    Safari ITP / quota eviction that can wipe localStorage). If IDB is empty
 *    but localStorage has a value, it is migrated to IDB.
 *
 * Server-state cache:
 *  - Diff baselines are kept in memory and dual-written to the checkpoint IDB
 *    so assumedMasterState survives reloads (avoids null-baseline conflict storms).
 *  - Updated after every successful push AND every pull.
 *
 * IDB-wipe resilience:
 *  - On startup we detect whether IDB appears empty after being previously
 *    populated (via a "population-epoch" flag in localStorage). If all stores
 *    read back 0 rows but the epoch flag says they were populated before, we
 *    trigger an immediate full pull (checkpoint = null) for every collection.
 */

import { getApiClient } from "@/src/api";
import type { HosanaDatabase } from "./database";
import { subscribeLocalChange } from "./engine/bus";
import { HosanaCollection } from "./engine/collection";
import { idbGet, idbPut, openIDB } from "./engine/idb";

// ─── Public types (unchanged interface) ──────────────────────────────────────

export type ReplicationSyncState = "syncing" | "synced" | "offline" | "error";

/** Minimal Subject-like object so SyncContext can subscribe with .subscribe() */
export interface StatusSubject {
  subscribe: (fn: (s: ReplicationSyncState) => void) => {
    unsubscribe: () => void;
  };
  next: (s: ReplicationSyncState) => void;
}

export interface ReplicationManager {
  start: () => void;
  stop: () => void;
  replicateNow: () => Promise<void>;
  status$: StatusSubject;
  getStatus: () => ReplicationSyncState;
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface Checkpoint {
  updatedAt: number;
  id: string;
}

type SyncableDoc = {
  id: string;
  updatedAt: string;
  _deleted?: boolean;
};

type CollectionName =
  | "songs"
  | "folders"
  | "collections"
  | "services"
  | "agendaEvents";

const ALL_COLLECTION_NAMES: CollectionName[] = [
  "songs",
  "folders",
  "collections",
  "services",
  "agendaEvents",
];

const PULL_BATCH = 100;
const PUSH_BATCH = 50;

// ─── Simple status subject ────────────────────────────────────────────────────

function makeStatusSubject(): StatusSubject {
  const listeners = new Set<(s: ReplicationSyncState) => void>();
  return {
    subscribe(fn) {
      listeners.add(fn);
      return { unsubscribe: () => listeners.delete(fn) };
    },
    next(s) {
      for (const fn of Array.from(listeners)) fn(s);
    },
  };
}

// ─── Conflict resolution (identical logic to old implementation) ──────────────

const CONFLICT_RETRY_LIMIT = 3;
const VOLATILE_FIELDS = ["updatedAt", "_rev", "_meta", "_attachments"] as const;

function omitVolatile<T extends Record<string, unknown>>(doc: T): Partial<T> {
  const clone: Partial<T> = { ...doc };
  for (const field of VOLATILE_FIELDS) delete clone[field as keyof T];
  return clone;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  )
    return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  const aKeys = Object.keys(a as object);
  const bKeys = Object.keys(b as object);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) =>
    deepEqual(
      (a as Record<string, unknown>)[k],
      (b as Record<string, unknown>)[k],
    ),
  );
}

function isSpuriousConflict<T extends SyncableDoc>(
  assumedMasterState: T | undefined,
  serverDoc: T,
): boolean {
  if (!assumedMasterState) return false;
  return deepEqual(omitVolatile(assumedMasterState), omitVolatile(serverDoc));
}

// ─── Push payload helpers ─────────────────────────────────────────────────────

/**
 * Strip local-only / engine-internal fields before anything hits the wire.
 */
function stripNonReplicatedFields<T extends SyncableDoc>(
  doc: T,
  localFields: ReadonlySet<string>,
): T {
  const out: Record<string, unknown> = { ...doc };
  for (const f of localFields) delete out[f];
  delete out["__tombstone"];
  delete out["score"]; // belt-and-suspenders for songs
  return out as T;
}

/**
 * Compute the set of fields that differ between `current` and `previous`.
 * Always includes `id` and `updatedAt` so the server can identify the doc
 * and perform conflict detection. If there is no previous state (new doc)
 * we return the full document.
 */
function diffFields<T extends SyncableDoc>(
  current: T & { _deleted: boolean },
  previous: (T & { _deleted: boolean }) | null,
): { id: string; updatedAt: string; _deleted: boolean } & Partial<T> {
  if (!previous) {
    return { ...current };
  }

  const delta: Record<string, unknown> = {
    id: current.id,
    updatedAt: current.updatedAt,
    _deleted: current._deleted,
  };

  for (const key of Object.keys(current) as (keyof T)[]) {
    if (key === "id" || key === "updatedAt" || key === "_deleted") continue;
    if (!deepEqual(current[key], previous[key])) {
      delta[key as string] = current[key];
    }
  }

  return delta as {
    id: string;
    updatedAt: string;
    _deleted: boolean;
  } & Partial<T>;
}

/**
 * Build the assumedMasterState payload for a change row.
 * Volatile fields are omitted.
 */
function buildAssumedMasterPayload<T extends SyncableDoc>(
  assumed: (T & { _deleted: boolean }) | null,
): ({ id: string; updatedAt: string } & Partial<T>) | null {
  if (!assumed) return null;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(assumed) as (keyof typeof assumed)[]) {
    if (VOLATILE_FIELDS.includes(key as (typeof VOLATILE_FIELDS)[number]))
      continue;
    out[key as string] = assumed[key];
  }
  return out as { id: string; updatedAt: string } & Partial<T>;
}

interface ChangeRow<T> {
  newDocumentState: {
    id: string;
    updatedAt: string;
    _deleted: boolean;
  } & Partial<T>;
  assumedMasterState: ({ id: string; updatedAt: string } & Partial<T>) | null;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  if (arr.length <= size) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function pushWithConflictRetry<T extends SyncableDoc>(
  client: ReturnType<typeof getApiClient>,
  collectionName: CollectionName,
  changeRows: ChangeRow<T>[],
): Promise<(T & { _deleted: boolean })[]> {
  let pending = changeRows;
  const realConflicts: (T & { _deleted: boolean })[] = [];

  for (let attempt = 0; attempt <= CONFLICT_RETRY_LIMIT; attempt++) {
    const res = await client.request<{ conflicts?: T[] } | T[]>(
      `/replication/${collectionName}/push`,
      {
        method: "POST",
        body: JSON.stringify({ changeRows: pending }),
      },
    );

    const conflicts = (
      Array.isArray(res) ? res : (res as { conflicts?: T[] })?.conflicts || []
    ).map(
      (doc) =>
        ({ ...doc, _deleted: !!doc._deleted }) as T & { _deleted: boolean },
    );

    if (conflicts.length === 0) break;

    const conflictsById = new Map(conflicts.map((c) => [c.id, c]));
    const retryRows: ChangeRow<T>[] = [];

    for (const row of pending) {
      const serverDoc = conflictsById.get(row.newDocumentState.id);
      if (!serverDoc) continue;

      const canRetry =
        attempt < CONFLICT_RETRY_LIMIT &&
        isSpuriousConflict(row.assumedMasterState as T | undefined, serverDoc);

      if (canRetry) {
        retryRows.push({
          newDocumentState: diffFields(
            row.newDocumentState as T & { _deleted: boolean },
            serverDoc,
          ),
          assumedMasterState: buildAssumedMasterPayload<T>(serverDoc),
        });
      } else {
        realConflicts.push(serverDoc);
      }
    }

    if (retryRows.length === 0) break;
    pending = retryRows;
  }

  return realConflicts;
}

// ─── Checkpoint + server-cache persistence (dual-write: IDB + localStorage) ──

const CP_KEY = "hosana_repl_checkpoint";
const EPOCH_KEY = "hosana_repl_epoch";

let _cpDb: IDBDatabase | null = null;
const CP_IDB_NAME = "hosana_checkpoints";
const CP_IDB_VERSION = 2;
const CP_STORE = "checkpoints";
const CACHE_STORE = "server_state";

async function getCheckpointDb(): Promise<IDBDatabase> {
  if (_cpDb) {
    try {
      // Touch a store name list — throws if the connection was closed.
      void _cpDb.objectStoreNames.length;
      return _cpDb;
    } catch {
      _cpDb = null;
    }
  }
  _cpDb = await openIDB(CP_IDB_NAME, CP_IDB_VERSION, (db, oldVersion) => {
    if (oldVersion < 1) {
      db.createObjectStore(CP_STORE, { keyPath: "collection" });
    }
    if (oldVersion < 2 && !db.objectStoreNames.contains(CACHE_STORE)) {
      db.createObjectStore(CACHE_STORE, { keyPath: "collection" });
    }
  });
  _cpDb.onclose = () => {
    _cpDb = null;
  };
  return _cpDb;
}

async function loadCheckpoint(
  collectionName: CollectionName,
): Promise<Checkpoint | null> {
  try {
    const db = await getCheckpointDb();
    const row = await idbGet<{ collection: string; cp: Checkpoint }>(
      db,
      CP_STORE,
      collectionName,
    );
    if (row?.cp) return row.cp;
  } catch {
    _cpDb = null;
  }

  try {
    const raw = localStorage.getItem(`${CP_KEY}_${collectionName}`);
    if (raw) {
      const cp = JSON.parse(raw) as Checkpoint;
      void saveCheckpoint(collectionName, cp);
      return cp;
    }
  } catch {
    // localStorage unavailable or corrupted
  }

  return null;
}

async function saveCheckpoint(
  collectionName: CollectionName,
  cp: Checkpoint,
): Promise<void> {
  try {
    const db = await getCheckpointDb();
    await idbPut(db, CP_STORE, { collection: collectionName, cp });
  } catch {
    _cpDb = null;
  }

  try {
    localStorage.setItem(`${CP_KEY}_${collectionName}`, JSON.stringify(cp));
  } catch {
    // Storage quota exceeded — non-fatal
  }
}

// ─── IDB-wipe detection ───────────────────────────────────────────────────────

/**
 * Mark that the main IDB has been confirmed populated.
 * Only set once (epoch 0 → 1) so empty-account sessions don't keep triggering
 * false-positive wipe detection forever.
 */
function markPopulationEpoch(): void {
  try {
    if (getPopulationEpoch() > 0) return;
    localStorage.setItem(EPOCH_KEY, "1");
  } catch {
    // non-fatal
  }
}

function getPopulationEpoch(): number {
  try {
    return parseInt(localStorage.getItem(EPOCH_KEY) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

// ─── Server-state cache for push diffs ───────────────────────────────────────

type ServerCache = Map<string, SyncableDoc & { _deleted: boolean }>;
const serverStateCache = new Map<CollectionName, ServerCache>();
const serverCacheHydrated = new Set<CollectionName>();

function getServerCache(collectionName: CollectionName): ServerCache {
  let cache = serverStateCache.get(collectionName);
  if (!cache) {
    cache = new Map();
    serverStateCache.set(collectionName, cache);
  }
  return cache;
}

async function hydrateServerCache(
  collectionName: CollectionName,
): Promise<ServerCache> {
  const cache = getServerCache(collectionName);
  if (serverCacheHydrated.has(collectionName)) return cache;

  try {
    const db = await getCheckpointDb();
    const row = await idbGet<{
      collection: string;
      docs: Array<SyncableDoc & { _deleted: boolean }>;
    }>(db, CACHE_STORE, collectionName);
    if (row?.docs) {
      for (const doc of row.docs) {
        if (doc?.id) cache.set(doc.id, doc);
      }
    }
  } catch {
    _cpDb = null;
  }

  serverCacheHydrated.add(collectionName);
  return cache;
}

async function persistServerCache(
  collectionName: CollectionName,
): Promise<void> {
  const cache = getServerCache(collectionName);
  try {
    const db = await getCheckpointDb();
    await idbPut(db, CACHE_STORE, {
      collection: collectionName,
      docs: Array.from(cache.values()),
    });
  } catch {
    _cpDb = null;
  }
}

// ─── Per-collection replication ───────────────────────────────────────────────

type AnyCollection = HosanaCollection<SyncableDoc & Record<string, unknown>>;

/**
 * Compare checkpoint (numeric ms or ISO) against a doc's ISO updatedAt.
 */
function checkpointToIso(cp: Checkpoint): string {
  return typeof cp.updatedAt === "number"
    ? new Date(cp.updatedAt).toISOString()
    : String(cp.updatedAt);
}

/**
 * Replicate one collection (push then pull).
 *
 * @param forceFullPull  When true, ignore the checkpoint and pull from the
 *                       beginning — used after an IDB-wipe is detected.
 * @param shouldAbort    Returns true when the manager was stopped mid-sync.
 */
async function replicateCollection<
  T extends SyncableDoc & Record<string, unknown>,
>(
  collection: AnyCollection,
  collectionName: CollectionName,
  client: ReturnType<typeof getApiClient>,
  forceFullPull = false,
  shouldAbort: () => boolean = () => false,
): Promise<void> {
  if (shouldAbort()) return;

  const checkpoint = await loadCheckpoint(collectionName);
  const serverCache = await hydrateServerCache(collectionName);
  const localFields = collection.getLocalFieldNames();
  let cacheDirty = false;

  // ─ Push FIRST ──────────────────────────────────────────────────────────────
  const checkpointTs = checkpoint ? checkpointToIso(checkpoint) : null;
  const allDocs = (collection as unknown as HosanaCollection<T>).getAllRaw();

  const toPush = allDocs.filter((d) => {
    const stripped = stripNonReplicatedFields(d, localFields);
    const newState = {
      ...stripped,
      _deleted: !!stripped._deleted,
    } as T & { _deleted: boolean };

    const cached = serverCache.get(d.id) as
      | (T & { _deleted: boolean })
      | undefined;

    // Prefer a content/tombstone diff against the last-known server snapshot.
    // This avoids re-pushing every cycle when the pull checkpoint hasn't yet
    // advanced past a locally stamped updatedAt.
    if (cached) {
      return (
        newState._deleted !== !!cached._deleted ||
        newState.updatedAt !== cached.updatedAt ||
        !deepEqual(
          omitVolatile(newState as Record<string, unknown>),
          omitVolatile(cached as Record<string, unknown>),
        )
      );
    }

    // No baseline yet — fall back to the pull checkpoint watermark.
    return (
      !checkpointTs ||
      (typeof d.updatedAt === "string" && d.updatedAt > checkpointTs)
    );
  });

  if (toPush.length > 0 && !shouldAbort()) {
    const pushedFull = new Map<string, T & { _deleted: boolean }>();

    const changeRows: ChangeRow<T>[] = toPush.map((doc) => {
      const stripped = stripNonReplicatedFields(doc, localFields);
      // Soft-delete (`isDeleted`) is a normal replicated field.
      // Only the explicit `_deleted` flag is the hard-delete tombstone.
      const newState = {
        ...stripped,
        _deleted: !!stripped._deleted,
      } as T & { _deleted: boolean };

      pushedFull.set(doc.id, newState);

      const cached =
        (serverCache.get(doc.id) as (T & { _deleted: boolean }) | undefined) ??
        null;

      return {
        newDocumentState: diffFields(newState, cached),
        assumedMasterState: buildAssumedMasterPayload<T>(cached),
      };
    });

    const realConflicts: (T & { _deleted: boolean })[] = [];

    for (const batch of chunkArray(changeRows, PUSH_BATCH)) {
      if (shouldAbort()) return;
      const conflicts = await pushWithConflictRetry<T>(
        client,
        collectionName,
        batch,
      );
      realConflicts.push(...conflicts);
    }

    const conflictIds = new Set(realConflicts.map((c) => c.id));

    // Update cache for successfully pushed docs; purge local tombstones.
    const tombstonesToPurge: string[] = [];
    for (const [id, full] of pushedFull) {
      if (conflictIds.has(id)) continue;
      if (full._deleted) {
        serverCache.delete(id);
        tombstonesToPurge.push(id);
      } else {
        serverCache.set(id, full);
      }
      cacheDirty = true;
    }

    if (tombstonesToPurge.length > 0) {
      await (collection as unknown as HosanaCollection<T>)._purgeIds(
        tombstonesToPurge,
      );
    }

    // Merge real conflicts (server wins on content)
    if (realConflicts.length > 0) {
      const live: (T & { _deleted: boolean })[] = [];
      const deletedIds: string[] = [];
      for (const serverDoc of realConflicts) {
        if (serverDoc._deleted) {
          serverCache.delete(serverDoc.id);
          deletedIds.push(serverDoc.id);
        } else {
          serverCache.set(serverDoc.id, serverDoc);
          live.push(serverDoc);
        }
        cacheDirty = true;
      }
      if (deletedIds.length > 0) {
        await (collection as unknown as HosanaCollection<T>)._purgeIds(
          deletedIds,
        );
      }
      if (live.length > 0) {
        await (
          collection as unknown as HosanaCollection<T>
        )._mergeBatchFromServer(live);
      }
    }
  }

  // ─ Pull ────────────────────────────────────────────────────────────────────
  let pullCheckpoint = forceFullPull ? null : checkpoint;

  while (!shouldAbort()) {
    const res = await client.request<{
      documents: T[];
      checkpoint: Checkpoint | null;
    }>(`/replication/${collectionName}/pull`, {
      method: "POST",
      body: JSON.stringify({
        checkpoint: pullCheckpoint || null,
        limit: PULL_BATCH,
      }),
    });

    const docs = (res.documents || []).map((d) => ({
      ...d,
      _deleted: !!d._deleted,
    })) as (T & { _deleted: boolean })[];

    if (docs.length > 0) {
      const live: (T & { _deleted: boolean })[] = [];
      const deletedIds: string[] = [];

      for (const doc of docs) {
        if (doc._deleted) {
          serverCache.delete(doc.id);
          deletedIds.push(doc.id);
        } else {
          serverCache.set(doc.id, stripNonReplicatedFields(doc, localFields));
          live.push(doc);
        }
        cacheDirty = true;
      }

      if (deletedIds.length > 0) {
        await (collection as unknown as HosanaCollection<T>)._purgeIds(
          deletedIds,
        );
      }
      if (live.length > 0) {
        await (
          collection as unknown as HosanaCollection<T>
        )._mergeBatchFromServer(live);
      }
    }

    if (res.checkpoint) {
      pullCheckpoint = res.checkpoint;
      await saveCheckpoint(collectionName, pullCheckpoint);
    }

    if (docs.length < PULL_BATCH) break;
  }

  if (cacheDirty && !shouldAbort()) {
    await persistServerCache(collectionName);
  }
}

// ─── Replication manager singleton ───────────────────────────────────────────

let replicationManagerInstance: ReplicationManager | null = null;

/** Tear down the existing singleton so a fresh one can be created (e.g. on re-login). */
export function resetReplication(): void {
  if (replicationManagerInstance) {
    replicationManagerInstance.stop();
    replicationManagerInstance = null;
  }
  serverStateCache.clear();
  serverCacheHydrated.clear();
}

export function setupReplication(db: HosanaDatabase): ReplicationManager {
  if (replicationManagerInstance) return replicationManagerInstance;

  const status$ = makeStatusSubject();
  let currentStatus: ReplicationSyncState = "synced";
  let running = false;
  let interval: ReturnType<typeof setInterval> | null = null;
  let onlineListener: (() => void) | null = null;
  let offlineListener: (() => void) | null = null;

  // Coalescing sync lock — callers of replicateNow always await until the
  // in-flight sync AND any follow-ups queued while it ran have finished.
  let currentRun: Promise<void> | null = null;
  let syncQueued = false;
  let queuedForceFullPull = false;

  const SAVE_DEBOUNCE_MS = 800;
  let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  const unsubscribeLocalChanges: Array<() => void> = [];

  const scheduleSyncOnSave = () => {
    if (!running) return;
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
      saveDebounceTimer = null;
      void doSync();
    }, SAVE_DEBOUNCE_MS);
  };

  const updateStatus = (s: ReplicationSyncState) => {
    if (currentStatus !== s) {
      currentStatus = s;
      status$.next(s);
    }
  };

  /**
   * Detect whether the IDB appears to have been wiped since the last session.
   * If the population epoch is > 0 (data was there before) but all collections
   * are empty now, we assume a spurious wipe and force a full pull.
   */
  const detectIdbWipe = (): boolean => {
    if (getPopulationEpoch() === 0) return false;
    const totalDocs =
      db.songs.getAllRaw().length +
      db.folders.getAllRaw().length +
      db.collections.getAllRaw().length +
      db.services.getAllRaw().length +
      db.agendaEvents.getAllRaw().length;
    return totalDocs === 0;
  };

  const runSyncOnce = async (forceFullPull: boolean) => {
    if (!navigator.onLine) {
      updateStatus("offline");
      return;
    }

    updateStatus("syncing");
    const client = getApiClient();
    const shouldAbort = () => !running;

    const idbWiped = forceFullPull || detectIdbWipe();
    if (idbWiped) {
      console.warn(
        "[hosana-repl] IDB appears empty after previously being populated — " +
          "forcing full pull to restore data.",
      );
    }

    // services first (FK ordering for agendaEvents)
    await replicateCollection(
      db.services as unknown as AnyCollection,
      "services",
      client,
      idbWiped,
      shouldAbort,
    );
    if (shouldAbort()) return;

    await Promise.all([
      replicateCollection(
        db.songs as unknown as AnyCollection,
        "songs",
        client,
        idbWiped,
        shouldAbort,
      ),
      replicateCollection(
        db.folders as unknown as AnyCollection,
        "folders",
        client,
        idbWiped,
        shouldAbort,
      ),
      replicateCollection(
        db.collections as unknown as AnyCollection,
        "collections",
        client,
        idbWiped,
        shouldAbort,
      ),
    ]);
    if (shouldAbort()) return;

    await replicateCollection(
      db.agendaEvents as unknown as AnyCollection,
      "agendaEvents",
      client,
      idbWiped,
      shouldAbort,
    );
    if (shouldAbort()) return;

    // Only mark populated when we actually have data (avoids false wipe
    // detection for brand-new empty accounts).
    const totalDocs =
      db.songs.getAllRaw().length +
      db.folders.getAllRaw().length +
      db.collections.getAllRaw().length +
      db.services.getAllRaw().length +
      db.agendaEvents.getAllRaw().length;
    if (totalDocs > 0) markPopulationEpoch();

    updateStatus("synced");
  };

  const doSync = (forceFullPull = false): Promise<void> => {
    syncQueued = true;
    queuedForceFullPull = queuedForceFullPull || forceFullPull;

    if (currentRun) return currentRun;

    currentRun = (async () => {
      try {
        while (syncQueued) {
          if (!running) {
            syncQueued = false;
            queuedForceFullPull = false;
            break;
          }
          const force = queuedForceFullPull;
          syncQueued = false;
          queuedForceFullPull = false;
          try {
            await runSyncOnce(force);
          } catch (err) {
            console.error("[hosana-repl] Sync error:", err);
            updateStatus(navigator.onLine ? "error" : "offline");
          }
        }
      } finally {
        const followUp = syncQueued && running;
        const force = queuedForceFullPull;
        currentRun = null;
        if (followUp) {
          await doSync(force);
        }
      }
    })();

    return currentRun;
  };

  const start = () => {
    if (running) return;
    running = true;

    void doSync();

    interval = setInterval(() => {
      if (running) void doSync();
    }, 15_000);

    onlineListener = () => {
      if (running) void doSync();
    };
    offlineListener = () => updateStatus("offline");
    window.addEventListener("online", onlineListener);
    window.addEventListener("offline", offlineListener);

    for (const name of ALL_COLLECTION_NAMES) {
      unsubscribeLocalChanges.push(
        subscribeLocalChange(name, scheduleSyncOnSave),
      );
    }
  };

  const stop = () => {
    running = false;
    if (interval) clearInterval(interval);
    interval = null;
    if (onlineListener) window.removeEventListener("online", onlineListener);
    if (offlineListener) window.removeEventListener("offline", offlineListener);
    onlineListener = null;
    offlineListener = null;

    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
    syncQueued = false;
    queuedForceFullPull = false;
    while (unsubscribeLocalChanges.length) {
      unsubscribeLocalChanges.pop()!();
    }
  };

  const replicateNow = async () => {
    if (!navigator.onLine) {
      updateStatus("offline");
      return;
    }
    // Ensure shouldAbort() stays false for an on-demand sync even if start()
    // hasn't been called (or was stopped).
    const wasRunning = running;
    if (!wasRunning) running = true;
    try {
      await doSync();
    } finally {
      if (!wasRunning) running = false;
    }
  };

  replicationManagerInstance = {
    start,
    stop,
    replicateNow,
    status$,
    getStatus: () => currentStatus,
  };

  return replicationManagerInstance;
}
