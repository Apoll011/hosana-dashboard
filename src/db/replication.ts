import { getApiClient } from "@hosanna/shared";
import { RxCollection, RxReplicationWriteToMasterRow, WithDeleted } from "rxdb";
import {
  replicateRxCollection,
  RxReplicationState,
} from "rxdb/plugins/replication";
import { Subject, Subscription } from "rxjs";
import { HosanaDatabase } from "./database";

export type ReplicationSyncState = "syncing" | "synced" | "offline" | "error";

export interface ReplicationManager {
  start: () => void;
  stop: () => void;
  replicateNow: () => Promise<void>;
  status$: Subject<ReplicationSyncState>;
  getStatus: () => ReplicationSyncState;
}

interface Checkpoint {
  updatedAt: number;
  id: string;
}

type SyncableDoc = { id: string; updatedAt: string; _deleted?: boolean };
type CollectionName = "songs" | "folders" | "services";

let replicationManagerInstance: ReplicationManager | null = null;

// ---------- Conflict-resolution helpers ----------

const CONFLICT_RETRY_LIMIT = 3;
// Fields RxDB/the server may legitimately change without it being a real
// content conflict — strip these before comparing docs.
const VOLATILE_FIELDS = ["updatedAt", "_rev", "_meta", "_attachments"] as const;

function omitVolatile<T extends Record<string, any>>(doc: T): Partial<T> {
  const clone: Partial<T> = { ...doc };
  for (const field of VOLATILE_FIELDS) delete (clone as any)[field];
  return clone;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    return false;
  }
  const aKeys = Object.keys(a as object);
  const bKeys = Object.keys(b as object);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => deepEqual((a as any)[k], (b as any)[k]));
}

/**
 * A conflict is "spurious" when the server doc is byte-for-byte identical to
 * what we assumed the master state was, aside from volatile fields like
 * `updatedAt`. In that case it's safe to retry the push using the server's
 * doc as the new assumedMasterState, rather than surfacing it as a real conflict.
 */
function isSpuriousConflict<T extends SyncableDoc>(
  assumedMasterState: WithDeleted<T> | undefined,
  serverDoc: WithDeleted<T>,
): boolean {
  if (!assumedMasterState) return false; // inserts can't be spurious conflicts
  return deepEqual(omitVolatile(assumedMasterState), omitVolatile(serverDoc));
}

async function pushWithConflictRetry<T extends SyncableDoc>(
  client: ReturnType<typeof getApiClient>,
  collectionName: CollectionName,
  changeRows: RxReplicationWriteToMasterRow<T>[],
): Promise<WithDeleted<T>[]> {
  let pending: RxReplicationWriteToMasterRow<T>[] = changeRows;
  const realConflicts: WithDeleted<T>[] = [];

  for (let attempt = 0; attempt <= CONFLICT_RETRY_LIMIT; attempt++) {
    const formattedChanges = pending.map((row) => ({
      newDocumentState: {
        ...row.newDocumentState,
        _deleted: !!row.newDocumentState._deleted,
      },
      assumedMasterState: row.assumedMasterState
        ? {
            ...row.assumedMasterState,
            _deleted: !!row.assumedMasterState._deleted,
          }
        : null,
    }));

    const res = await client.request<{ conflicts?: T[] } | T[]>(
      `/replication/${collectionName}/push`,
      {
        method: "POST",
        body: JSON.stringify({ changeRows: formattedChanges }),
      },
    );

    const conflicts = (Array.isArray(res) ? res : res?.conflicts || []).map(
      (doc) => ({ ...doc, _deleted: !!doc._deleted }) as WithDeleted<T>,
    );

    if (conflicts.length === 0) break;

    const conflictsById = new Map(conflicts.map((c) => [c.id, c]));
    const retryRows: RxReplicationWriteToMasterRow<T>[] = [];

    for (const row of pending) {
      const serverDoc = conflictsById.get(row.newDocumentState.id);
      if (!serverDoc) continue; // this row succeeded, not in the conflict set

      const canRetry =
        attempt < CONFLICT_RETRY_LIMIT &&
        isSpuriousConflict<T>(
          row.assumedMasterState as WithDeleted<T> | undefined,
          serverDoc,
        );

      if (canRetry) {
        // Content matches what we assumed — only volatile fields (e.g. updatedAt)
        // drifted. Retry with the server's doc as the fresh assumed master state.
        retryRows.push({
          newDocumentState: row.newDocumentState,
          assumedMasterState: serverDoc as any,
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

// ---------- Replication setup ----------

export function setupReplication(db: HosanaDatabase): ReplicationManager {
  if (replicationManagerInstance) {
    return replicationManagerInstance;
  }

  const status$ = new Subject<ReplicationSyncState>();
  let currentStatus: ReplicationSyncState = "synced";
  let activeReplications: RxReplicationState<SyncableDoc, Checkpoint>[] = [];
  const activeStateMap = new Map<CollectionName, boolean>();
  const subscriptions: Subscription[] = [];
  let onlineListener: (() => void) | null = null;
  let offlineListener: (() => void) | null = null;

  const updateStatus = (status: ReplicationSyncState) => {
    if (currentStatus !== status) {
      currentStatus = status;
      status$.next(status);
    }
  };

  const createCollectionReplication = <T extends SyncableDoc>(
    collectionName: CollectionName,
    collection: RxCollection,
  ) => {
    const replicationState = replicateRxCollection<T, Checkpoint>({
      collection,
      replicationIdentifier: `hosanna-http-repl-${collectionName}`,
      live: true,
      retryTime: 5000,
      autoStart: false,
      pull: {
        async handler(lastCheckpoint, batchSize) {
          if (!navigator.onLine) {
            updateStatus("offline");
            return { documents: [], checkpoint: lastCheckpoint };
          }

          try {
            const client = getApiClient();
            const res = await client.request<{
              documents: T[];
              checkpoint: Checkpoint | null;
            }>(`/replication/${collectionName}/pull`, {
              method: "POST",
              body: JSON.stringify({
                checkpoint: lastCheckpoint || null,
                limit: batchSize || 100,
              }),
            });

            const documents: WithDeleted<T>[] = (res.documents || []).map(
              (doc) => ({
                ...doc,
                _deleted: !!doc._deleted,
              }),
            );

            return {
              documents,
              checkpoint: res.checkpoint ?? lastCheckpoint ?? undefined,
            };
          } catch (err) {
            console.error(`Pull error on ${collectionName}:`, err);
            updateStatus(navigator.onLine ? "error" : "offline");
            throw err;
          }
        },
        batchSize: 100,
      },
      push: {
        async handler(changeRows) {
          if (!navigator.onLine) {
            updateStatus("offline");
            return [];
          }

          try {
            const client = getApiClient();
            return await pushWithConflictRetry<T>(
              client,
              collectionName,
              changeRows,
            );
          } catch (err) {
            console.error(`Push error on ${collectionName}:`, err);
            updateStatus(navigator.onLine ? "error" : "offline");
            throw err;
          }
        },
        batchSize: 100,
      },
    });

    subscriptions.push(
      replicationState.error$.subscribe((err) => {
        console.error(`Replication error in ${collectionName}:`, err);
        updateStatus(navigator.onLine ? "error" : "offline");
      }),
    );

    return replicationState;
  };

  const start = () => {
    if (activeReplications.length > 0) return;

    const collectionsToSync: [CollectionName, RxCollection][] = [
      ["songs", db.songs],
      ["folders", db.folders],
      ["services", db.services],
    ];

    activeReplications = collectionsToSync.map(([name, collection]) =>
      createCollectionReplication(name, collection),
    );

    collectionsToSync.forEach(([name], idx) => {
      activeStateMap.set(name, false);
      const repl = activeReplications[idx];

      subscriptions.push(
        repl.active$.subscribe((isActive) => {
          activeStateMap.set(name, isActive);
          if (!navigator.onLine) {
            updateStatus("offline");
          } else if (isActive) {
            updateStatus("syncing");
          } else {
            const anyActive = Array.from(activeStateMap.values()).some(Boolean);
            if (!anyActive) updateStatus("synced");
          }
        }),
      );

      repl.start();
    });

    onlineListener = () => {
      updateStatus("syncing");
      activeReplications.forEach((r) => r.reSync());
    };
    offlineListener = () => updateStatus("offline");

    window.addEventListener("online", onlineListener);
    window.addEventListener("offline", offlineListener);
  };

  const stop = () => {
    activeReplications.forEach((r) => r.cancel());
    activeReplications = [];
    activeStateMap.clear();

    subscriptions.forEach((s) => s.unsubscribe());
    subscriptions.length = 0;

    if (onlineListener) window.removeEventListener("online", onlineListener);
    if (offlineListener) window.removeEventListener("offline", offlineListener);
    onlineListener = null;
    offlineListener = null;
  };

  const replicateNow = async () => {
    if (!navigator.onLine) {
      updateStatus("offline");
      return;
    }
    updateStatus("syncing");
    try {
      await Promise.all(activeReplications.map((r) => r.reSync()));
      updateStatus("synced");
    } catch (err) {
      console.error("Manual replication failed:", err);
      updateStatus(navigator.onLine ? "error" : "offline");
      throw err;
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
