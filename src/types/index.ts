/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Song {
  id: string;
  orgId?: string;
  title: string;
  artist: string;
  song_number?: number | null;
  content: string; // ChordPro text format
  folderId?: string | null;
  path: string; // e.g., "Hymns/Amazing Grace.pro" or "Amazing Grace.pro"
  tags: string[];
  createdAt?: string;
  updatedAt: string;
  deleted?: boolean;
  purgeAt?: string | null;
}

export interface ParsedSong extends Song {
  folder: string; // e.g. "Worship" or "" (root)
  fileName: string; // e.g. "Digno_es_Tu.chopro"
  metadata: {
    title?: string;
    subtitle?: string;
    artist?: string;
    composer?: string;
    copyright?: string;
    album?: string;
    key?: string;
    originalKey?: string;
    tempo?: string;
    time?: string;
    capo?: string;
    songNumber?: string;
    youtube?: string;
    ccli?: string;
    duration?: string;
    [key: string]: string | undefined;
  };
}

export interface SongsResponse {
  songs: Song[];
  total: number;
  page: number;
  totalPages: number;
}

export interface Folder {
  id: string;
  orgId?: string;
  name: string;
  color?: string;
  icon?: string;
  parentId?: string | null;
  songCount?: number | null;
  folderCount?: number | null;
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
  purgeAt?: string | null;
}

export interface FoldersResponse {
  folders: Folder[];
  rootSongsCount: number;
}

export interface ServiceElement {
  id: string;
  type:
    | "welcome"
    | "scripture"
    | "message"
    | "announcement"
    | "custom"
    | "song"
    | string;
  title: string;
  content?: string;
  position?: number;
  songId?: string;
  notes?: string;
  passage?: string;
  duration?: number;
}

export interface Service {
  id: string;
  orgId?: string;
  name: string;
  date: string;
  archived: boolean;
  notes?: string | null; // Service-wide planning notes
  elements?: ServiceElement[];
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
  purgeAt?: string | null;
}

export interface SyncStatusResponse {
  versionHash: string;
  timestamp: string;
  timestamps: {
    songs: string;
    folders: string;
    services: string;
  };
}

export interface GetSongsParams {
  search?: string;
  folder?: string;
  sortBy?: "title" | "artist" | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  key?: string;
  tag?: string;
  searchFields?: {
    title: boolean;
    artist: boolean;
    content: boolean;
    tags: boolean;
  };
}

export interface FolderNode {
  name: string;
  path: string;
  type: "folder" | "song";
  children?: FolderNode[];
  songId?: string;
}

export type SyncStatus =
  "synced" | "syncing" | "error" | "offline" | "local_only";

export interface CifraResult {
  url: string;
  name?: string;
  artist?: string;
  youtube_url?: string;
  cifra?: string;
  error?: string;
}
