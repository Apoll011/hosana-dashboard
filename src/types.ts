/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'leader' | 'musician';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  content: string; // ChordPro text format
  folderId?: string | null;
  path: string;    // e.g., "Hymns/Amazing Grace.pro" or "Amazing Grace.pro"
  tags: string[];
  createdAt?: string;
  updatedAt: string;
}

export interface SongsResponse {
  songs: Song[];
  total: number;
  page: number;
  totalPages: number;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string | null;
  songCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FolderNode {
  name: string;
  path: string;
  type: 'folder' | 'song';
  children?: FolderNode[];
  songId?: string;
}

export interface FoldersResponse {
  folders: Folder[];
  rootSongsCount: number;
}

export interface ServiceSong {
  songId: string;
  notes: string;
}

export interface Service {
  id: string;
  name: string;
  date: string;
  notes: string; // Service-wide planning notes
  songIds: string[];
  songs: Array<{ songId: string; notes: string; position: number }>;
  songNotes: Record<string, string>; // Maps songId -> notes
  createdAt: string;
  updatedAt: string;
}

export interface MusicianToken {
  id: string;
  name: string;
  token?: string; // Only present in create/regenerate response
  tokenPreview: string;
  status: 'active' | 'revoked' | 'expired';
  expiresAt: string;
  revokedAt?: string | null;
  lastUsedAt?: string | null;
  allowedServices: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ServerSettings {
  id: string;
  serverName: string;
  defaultKey: string;
  syncIntervalSeconds: number;
  allowPublicRead: boolean;
  autoBackupEnabled: boolean;
  maxUploadMB: number;
  updatedAt: string;
}

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline' | 'local_only';

export interface APIError {
  message: string;
  status?: number;
}
