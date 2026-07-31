/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Folder, FoldersResponse } from "@hosanna/shared";
import { httpClient } from "./client";

export const foldersApi = {
  getFolders: async (): Promise<FoldersResponse> => {
    return httpClient.request<FoldersResponse>("/folders");
  },

  getFlatFolders: async (): Promise<Folder[]> => {
    return httpClient.request<Folder[]>("/folders/flat");
  },

  createFolder: async (
    name: string,
    parentId?: string | null,
  ): Promise<Folder> => {
    return httpClient.request<Folder>("/folders", {
      method: "POST",
      body: JSON.stringify({ name, parentId }),
    });
  },

  updateFolder: async (
    id: string,
    data: { name?: string; parentId?: string | null; updatedAt: string },
  ): Promise<Folder> => {
    return httpClient.request<Folder>(`/folders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  renameFolder: async (
    id: string,
    name: string,
    updatedAt: string,
  ): Promise<Folder> => {
    return httpClient.request<Folder>(`/folders/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, updatedAt }),
    });
  },

  moveFolder: async (
    id: string,
    parentId: string | null,
    updatedAt: string,
  ): Promise<Folder> => {
    return httpClient.request<Folder>(`/folders/${id}`, {
      method: "PUT",
      body: JSON.stringify({ parentId, updatedAt }),
    });
  },

  deleteFolder: async (
    id: string,
    action: "delete_songs" | "move_to_root",
  ): Promise<void> => {
    return httpClient.request<void>(`/folders/${id}?action=${action}`, {
      method: "DELETE",
    });
  },

  deleteFolderAndSongs: async (
    id: string,
  ): Promise<{ deletedSongs: number }> => {
    return httpClient.request<{ deletedSongs: number }>(
      `/folders/${id}/with-songs`,
      {
        method: "DELETE",
      },
    );
  },

  deleteFolderAndMoveSongsToRoot: async (
    id: string,
  ): Promise<{ movedSongs: number }> => {
    return httpClient.request<{ movedSongs: number }>(
      `/folders/${id}/move-songs-to-root`,
      {
        method: "DELETE",
      },
    );
  },

  moveSongsInFolder: async (id: string, songIds: string[]): Promise<void> => {
    return httpClient.request<void>(`/folders/${id}/songs`, {
      method: "PUT",
      body: JSON.stringify({ songIds }),
    });
  },
};
