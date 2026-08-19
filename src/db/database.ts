import { createRxDatabase, RxDatabase, addRxPlugin } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import {
  songSchema,
  folderSchema,
  serviceSchema,
  SongDocType,
  FolderDocType,
  ServiceDocType,
} from "./schemas";

addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

if (import.meta.env.DEV) {
  addRxPlugin(RxDBDevModePlugin);
}

export type HosanaDatabaseCollections = {
  songs: import("rxdb").RxCollection<SongDocType>;
  folders: import("rxdb").RxCollection<FolderDocType>;
  services: import("rxdb").RxCollection<ServiceDocType>;
};

export type HosanaDatabase = RxDatabase<HosanaDatabaseCollections>;

let dbPromise: Promise<HosanaDatabase> | null = null;

export async function getDatabase(): Promise<HosanaDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await createRxDatabase<HosanaDatabaseCollections>({
        name: "hosanadb",
        storage: getRxStorageDexie(),
        ignoreDuplicate: true,
      });

      await db.addCollections({
        songs: {
          schema: songSchema,
        },
        folders: {
          schema: folderSchema,
        },
        services: {
          schema: serviceSchema,
        },
      });

      return db;
    })();
  }
  return dbPromise;
}
