import { addRxPlugin, createRxDatabase, RxDatabase } from "rxdb";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import {
  FolderDocType,
  folderSchema,
  ServiceDocType,
  serviceSchema,
  SongDocType,
  songSchema,
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
        storage: wrappedValidateAjvStorage({
          storage: getRxStorageDexie(),
        }),
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
