import { addRxPlugin, createRxDatabase, RxDatabase } from "rxdb";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { RxDBMigrationSchemaPlugin } from "rxdb/plugins/migration-schema";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import {
  AgendaEventDocType,
  agendaEventSchema,
  FolderDocType,
  folderSchema,
  ServiceDocType,
  serviceSchema,
  SongDocType,
  songSchema,
} from "./schemas";
import { TRASH_RETENTION_MS } from "./trash";

addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBMigrationSchemaPlugin);

if (import.meta.env.DEV) {
  addRxPlugin(RxDBDevModePlugin);
}

export type HosanaDatabaseCollections = {
  songs: import("rxdb").RxCollection<SongDocType>;
  folders: import("rxdb").RxCollection<FolderDocType>;
  services: import("rxdb").RxCollection<ServiceDocType>;
  agendaEvents: import("rxdb").RxCollection<AgendaEventDocType>;
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

      const migrateToTrash = <T extends { isDeleted?: boolean }>(
        oldDoc: Partial<T>,
      ) => ({
        ...oldDoc,
        isDeleted: oldDoc.isDeleted ?? false,
        purgeAt: oldDoc.isDeleted
          ? new Date(Date.now() + TRASH_RETENTION_MS).toISOString()
          : null,
      });

      await db.addCollections({
        songs: {
          schema: songSchema,
          migrationStrategies: {
            1: migrateToTrash<SongDocType>,
          },
        },
        folders: {
          schema: folderSchema,
          migrationStrategies: {
            1: () => null,
            2: (oldDoc: Partial<FolderDocType>) => ({
              ...oldDoc,
              color: oldDoc.color || "default",
              icon: oldDoc.icon || "default",
            }),
            3: migrateToTrash<FolderDocType>,
          },
        },
        services: {
          schema: serviceSchema,
          migrationStrategies: {
            1: migrateToTrash<ServiceDocType>,
          },
        },
        agendaEvents: {
          schema: agendaEventSchema,
          migrationStrategies: {
            1: migrateToTrash<AgendaEventDocType>,
          },
        },
      });

      return db;
    })();
  }
  return dbPromise;
}
