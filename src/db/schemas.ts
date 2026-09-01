import { ReminderSettings, Responsibility, ServiceElement } from "@/src/types";
import { RxJsonSchema } from "rxdb";

export interface SongDocType {
  id: string;
  title: string;
  artist: string;
  content: string;
  folderId: string | null;
  path: string;
  tags: string[];
  song_number: number | null;
  createdAt: string;
  updatedAt: string;
  _deleted?: boolean;
  isDeleted?: boolean;
  purgeAt?: string | null;
}

export const songSchema: RxJsonSchema<SongDocType> = {
  version: 1,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    title: {
      type: "string",
    },
    artist: {
      type: "string",
    },
    content: {
      type: "string",
    },
    folderId: {
      type: ["string", "null"],
      maxLength: 100,
    },
    path: {
      type: "string",
    },
    tags: {
      type: "array",
      items: {
        type: "string",
      },
    },
    song_number: {
      type: ["number", "null"],
    },
    createdAt: {
      type: "string",
    },
    updatedAt: {
      type: "string",
      maxLength: 50,
    },
    _deleted: {
      type: "boolean",
    },
    isDeleted: {
      type: "boolean",
    },
    purgeAt: {
      type: ["string", "null"],
    },
  },
  required: ["id", "title", "updatedAt"],
  indexes: ["updatedAt"],
};

export interface FolderDocType {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  songCount: number | null;
  folderCount: number | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  _deleted?: boolean;
  isDeleted?: boolean;
  purgeAt?: string | null;
}

export const folderSchema: RxJsonSchema<FolderDocType> = {
  version: 3,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    name: {
      type: "string",
    },
    color: {
      type: "string",
    },
    icon: {
      type: "string",
    },
    parentId: {
      type: ["string", "null"],
      maxLength: 100,
    },
    createdAt: {
      type: "string",
    },
    songCount: {
      type: ["number", "null"],
    },
    folderCount: {
      type: ["number", "null"],
    },
    updatedAt: {
      type: "string",
      maxLength: 50,
    },
    _deleted: {
      type: "boolean",
    },
    isDeleted: {
      type: "boolean",
    },
    purgeAt: {
      type: ["string", "null"],
    },
  },
  required: ["id", "name", "updatedAt"],
  indexes: ["updatedAt"],
};

export interface ServiceDocType {
  id: string;
  name: string;
  date: string;
  notes: string | null;
  elements: ServiceElement[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  _deleted?: boolean;
  isDeleted?: boolean;
  purgeAt?: string | null;
}

export const serviceSchema: RxJsonSchema<ServiceDocType> = {
  version: 1,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    name: {
      type: "string",
    },
    date: {
      type: "string",
    },
    notes: {
      type: ["string", "null"],
    },
    elements: {
      type: "array",
      items: {
        type: "object",
      },
    },
    archived: {
      type: "boolean",
    },
    createdAt: {
      type: "string",
    },
    updatedAt: {
      type: "string",
      maxLength: 50,
    },
    _deleted: {
      type: "boolean",
    },
    isDeleted: {
      type: "boolean",
    },
    purgeAt: {
      type: ["string", "null"],
    },
  },
  required: ["id", "name", "updatedAt"],
  indexes: ["updatedAt"],
};

/**
 * Wire/doc shape of an agenda event — mirrors the server's `agendaEvents`
 * replication collection (see the replication contract). The `reminder` and
 * `responsibilities` payloads are the same domain types used by the Agenda UI
 * (`@/src/types`), stored verbatim in jsonb columns on the server.
 *
 * Notes on the contract:
 * - `date` is a **local** "yyyy-mm-dd" string. It is never converted to/from
 *   UTC or timezone-shifted — treat it as an opaque local date.
 * - `time` is 24h "HH:mm" (no seconds, no timezone).
 * - `linkedServiceId` is a real FK to a `services` row on the server
 *   (`ON DELETE SET NULL`), so pushes must order `services` before
 *   `agendaEvents` (see `src/db/replication.ts`).
 * - `isDeleted`/`purgeAt` implement the shared trash semantics: soft-deleted
 *   rows keep being pulled (recoverable), hard purge is a server cron job.
 * - `_deleted` is RxDB's tombstone and is always `false` on pull.
 */
export interface AgendaEventDocType {
  id: string;
  /** Local calendar date "yyyy-mm-dd" — never timezone-shifted. */
  date: string;
  title: string;
  /** Free-text event type, e.g. "Culto Dominical". */
  type: string;
  /** 24h start time "HH:mm". */
  time: string;
  durationMinutes: number;
  location: string | null;
  notes: string | null;
  /** Reminder settings — always present. */
  reminder: ReminderSettings;
  /** Optional FK to an order-of-worship `services` doc id. */
  linkedServiceId: string | null;
  /** Responsibilities assigned to this event (may be []). */
  responsibilities: Responsibility[];
  createdAt: string;
  updatedAt: string; // conflict-detection field — keep verbatim from the server
  /** Trash flag — NOT RxDB's tombstone (see `_deleted`). */
  isDeleted: boolean;
  /** Set while trashed; null when live or restored. */
  purgeAt: string | null;
  /** Reserved RxDB tombstone. Always false on pull. */
  _deleted?: boolean;
}

export const agendaEventSchema: RxJsonSchema<AgendaEventDocType> = {
  version: 1,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    date: {
      // Local "yyyy-mm-dd" — exactly 10 chars, see the replication contract.
      type: "string",
      maxLength: 10,
    },
    title: {
      type: "string",
    },
    type: {
      type: "string",
    },
    time: {
      type: "string",
    },
    durationMinutes: {
      type: "number",
    },
    location: {
      type: ["string", "null"],
    },
    notes: {
      type: ["string", "null"],
    },
    reminder: {
      type: "object",
      properties: {
        enabled: {
          type: "boolean",
        },
        label: {
          type: "string",
        },
      },
      required: ["enabled", "label"],
      additionalProperties: false,
    },
    linkedServiceId: {
      type: ["string", "null"],
      maxLength: 100,
    },
    responsibilities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            maxLength: 100,
          },
          categoryId: {
            type: "string",
            maxLength: 100,
          },
          assignees: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  maxLength: 100,
                },
                name: {
                  type: "string",
                },
                memberId: {
                  type: "string",
                  maxLength: 100,
                },
                avatarUrl: {
                  // Org members without an image report `user.image === null`
                  // (Better Auth), so null must be accepted here — the server
                  // stores responsibilities verbatim in jsonb and re-sends it.
                  type: ["string", "null"],
                },
              },
              required: ["id", "name"],
              additionalProperties: false,
            },
          },
        },
        required: ["id", "categoryId", "assignees"],
        additionalProperties: false,
      },
    },
    createdAt: {
      type: "string",
    },
    updatedAt: {
      type: "string",
      maxLength: 50,
    },
    _deleted: {
      type: "boolean",
    },
    isDeleted: {
      type: "boolean",
    },
    purgeAt: {
      type: ["string", "null"],
    },
  },
  required: [
    "id",
    "date",
    "title",
    "type",
    "time",
    "durationMinutes",
    "reminder",
    "responsibilities",
    "createdAt",
    "updatedAt",
  ],
  indexes: ["updatedAt", "date"],
};
