import { getApiClient } from "@hosanna/shared";
import { RxCollection, WithDeleted } from "rxdb";
import {
  replicateRxCollection,
  RxReplicationState,
} from "rxdb/plugins/replication";
import { Subject } from "rxjs";
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

let replicationManagerInstance: ReplicationManager | null = null;

export function setupReplication(db: HosanaDatabase): ReplicationManager {
  if (replicationManagerInstance) {
    return replicationManagerInstance;
  }

  const status$ = new Subject<ReplicationSyncState>();
  let currentStatus: ReplicationSyncState = "synced";
  let activeReplications: RxReplicationState<
    { id: string; updatedAt: string; _deleted?: boolean },
    Checkpoint
  >[] = [];
  const activeStateMap = new Map<string, boolean>();

  const updateStatus = (status: ReplicationSyncState) => {
    if (currentStatus !== status) {
      currentStatus = status;
      status$.next(status);
    }
  };

  const createCollectionReplication = <
    T extends { id: string; updatedAt: string; _deleted?: boolean },
  >(
    collectionName: "songs" | "folders" | "services",
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
          try {
            if (!navigator.onLine) {
              updateStatus("offline");
              return {
                documents: [],
                checkpoint: lastCheckpoint,
              };
            }

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

            const checkpoint = res.checkpoint ?? lastCheckpoint ?? undefined;

            return {
              documents,
              checkpoint: checkpoint || undefined,
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
        async handler(changeRows): Promise<WithDeleted<T>[]> {
          try {
            if (!navigator.onLine) {
              updateStatus("offline");
              return [];
            }

            const client = getApiClient();
            const formattedChanges = changeRows.map((row) => ({
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
                body: JSON.stringify({
                  changeRows: formattedChanges,
                }),
              },
            );

            const conflicts = Array.isArray(res) ? res : res?.conflicts || [];
            return conflicts.map((doc) => ({
              ...doc,
              _deleted: !!doc._deleted,
            })) as WithDeleted<T>[];
          } catch (err) {
            console.error(`Push error on ${collectionName}:`, err);
            updateStatus(navigator.onLine ? "error" : "offline");
            throw err;
          }
        },
        batchSize: 100,
      },
    });

    replicationState.error$.subscribe((err) => {
      console.error(`Replication error in ${collectionName}:`, err);
      updateStatus(navigator.onLine ? "error" : "offline");
    });

    return replicationState;
  };

  const start = () => {
    if (activeReplications.length > 0) return;

    const replSongs = createCollectionReplication("songs", db.songs);
    const replFolders = createCollectionReplication("folders", db.folders);
    const replServices = createCollectionReplication("services", db.services);

    activeReplications = [replSongs, replFolders, replServices];

    activeReplications.forEach((repl, idx) => {
      const key = `repl-${idx}`;
      activeStateMap.set(key, false);

      repl.active$.subscribe((isActive) => {
        activeStateMap.set(key, isActive);
        if (!navigator.onLine) {
          updateStatus("offline");
        } else if (isActive) {
          updateStatus("syncing");
        } else {
          const anyActive = Array.from(activeStateMap.values()).some(Boolean);
          if (!anyActive) {
            updateStatus("synced");
          }
        }
      });
      repl.start();
    });

    window.addEventListener("online", () => {
      updateStatus("syncing");
      activeReplications.forEach((r) => r.reSync());
    });

    window.addEventListener("offline", () => {
      updateStatus("offline");
    });
  };

  const stop = () => {
    activeReplications.forEach((r) => r.cancel());
    activeReplications = [];
    activeStateMap.clear();
  };

  const replicateNow = async () => {
    if (!navigator.onLine) {
      updateStatus("offline");
      return;
    }
    updateStatus("syncing");
    await Promise.all(activeReplications.map((r) => r.reSync()));
    updateStatus("synced");
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
