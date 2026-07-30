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

export interface Tenant {
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
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

export interface ServiceElement {
  id: string;
  type: 'welcome' | 'scripture' | 'message' | 'reading' | 'announcement' | 'custom' | 'song' | string;
  title: string;
  content?: string;
  position?: number;
  songId?: string;
  notes?: string;
  passage?: string;
}

export interface Service {
  id: string;
  name: string;
  date: string;
  notes: string; // Service-wide planning notes
  elements?: ServiceElement[];
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
  showChordsDefault?: boolean;
  updatedAt: string;
}

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline' | 'local_only';

export interface APIError {
  message: string;
  status?: number;
  code?: string;
}

export interface AdminUser {
  id: string;
  tenantId?: string;
  email: string;
  name: string;
  role: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface RegisterTenantParams {
  tenantName: string;
  tenantSlug: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface RegisterUserParams {
  tenantSlug: string;
  name: string;
  email: string;
  password: string;
}

export interface CreateAdminParams {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface SyncStatusResponse {
  versionHash: string;
  timestamp: string;
  timestamps: {
    songs: string;
    folders: string;
    services: string;
    musicians: string;
    settings: string;
    admins: string;
  };
}

