import { ServiceElement } from "@hosanna/shared";
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
