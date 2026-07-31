/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FolderNode {
  name: string;
  path: string;
  type: "folder" | "song";
  children?: FolderNode[];
  songId?: string;
}

export type SyncStatus =
  | "synced"
  | "syncing"
  | "error"
  | "offline"
  | "local_only";
