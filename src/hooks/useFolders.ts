/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { Folder } from "@hosanna/shared";
import { useSync } from "../contexts/SyncContext";
import { getDatabase, FolderDocType } from "../db";

export function useFolders() {
  const { showToast } = useSync();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [rootSongsCount, setRootSongsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isSubscribed = true;
    let rxSubFolders: { unsubscribe: () => void } | null = null;
    let rxSubSongs: { unsubscribe: () => void } | null = null;

    async function subscribeData() {
      try {
        const db = await getDatabase();
        if (!isSubscribed) return;

        rxSubFolders = db.folders
          .find({
            selector: {
              _deleted: {
                $ne: true,
              },
            },
          })
          .$.subscribe((docs) => {
            if (!isSubscribed) return;
            setFolders(docs.map((d) => d.toJSON() as Folder));
            setIsLoading(false);
          });

        rxSubSongs = db.songs
          .find({
            selector: {
              _deleted: { $ne: true },
              folderId: null,
            },
          })
          .$.subscribe((docs) => {
            if (!isSubscribed) return;
            setRootSongsCount(docs.length);
          });
      } catch (err) {
        console.error("Failed to query folders from RxDB", err);
        setIsLoading(false);
      }
    }

    void subscribeData();

    return () => {
      isSubscribed = false;
      if (rxSubFolders) rxSubFolders.unsubscribe();
      if (rxSubSongs) rxSubSongs.unsubscribe();
    };
  }, []);

  const createFolder = useCallback(
    async ({
      name,
      parentId,
    }: {
      name: string;
      parentId?: string | null;
    }) => {
      setIsCreating(true);
      try {
        const db = await getDatabase();
        const now = new Date().toISOString();
        const newFolder: FolderDocType = {
          id: crypto.randomUUID(),
          name,
          parentId: parentId ?? null,
          createdAt: now,
          updatedAt: now,
          _deleted: false,
        };

        const doc = await db.folders.insert(newFolder);
        const result = doc.toJSON() as Folder;
        showToast(`Folder "${result.name}" created`, "success");
        return result;
      } catch (err: any) {
        showToast(err.message || "Failed to create folder", "error");
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [showToast]
  );

  const renameFolder = useCallback(
    async ({
      id,
      name,
    }: {
      id: string;
      name: string;
      updatedAt?: string;
    }) => {
      setIsRenaming(true);
      try {
        const db = await getDatabase();
        const doc = await db.folders.findOne(id).exec();
        if (doc) {
          await doc.patch({
            name,
            updatedAt: new Date().toISOString(),
          });
        }
        showToast("Folder renamed", "success");
      } catch (err: any) {
        showToast(err.message || "Failed to rename folder", "error");
        throw err;
      } finally {
        setIsRenaming(false);
      }
    },
    [showToast]
  );

  const moveFolder = useCallback(
    async ({
      id,
      parentId,
    }: {
      id: string;
      parentId: string | null;
      updatedAt?: string;
    }) => {
      setIsMoving(true);
      try {
        const db = await getDatabase();
        const doc = await db.folders.findOne(id).exec();
        if (doc) {
          await doc.patch({
            parentId: parentId ?? null,
            updatedAt: new Date().toISOString(),
          });
        }
        showToast("Folder moved", "success");
      } catch (err: any) {
        showToast(err.message || "Failed to move folder", "error");
        throw err;
      } finally {
        setIsMoving(false);
      }
    },
    [showToast]
  );

  const deleteFolder = useCallback(
    async ({
      id,
      action,
    }: {
      id: string;
      action: "delete_songs" | "move_to_root";
    }) => {
      setIsDeleting(true);
      try {
        const db = await getDatabase();
        const now = new Date().toISOString();

        // 1. Soft-delete the folder
        const folderDoc = await db.folders.findOne(id).exec();
        if (folderDoc) {
          await folderDoc.patch({
            _deleted: true,
            updatedAt: now,
          });
        }

        // 2. Handle child songs
        const songsInFolder = await db.songs
          .find({
            selector: {
              folderId: id,
              _deleted: { $ne: true },
            },
          })
          .exec();

        for (const songDoc of songsInFolder) {
          if (action === "delete_songs") {
            await songDoc.patch({
              _deleted: true,
              updatedAt: now,
            });
          } else {
            await songDoc.patch({
              folderId: null,
              updatedAt: now,
            });
          }
        }

        // 3. Handle subfolders recursively / move to root
        const subfolders = await db.folders
          .find({
            selector: {
              parentId: id,
              _deleted: { $ne: true },
            },
          })
          .exec();

        for (const sub of subfolders) {
          await sub.patch({
            parentId: null,
            updatedAt: now,
          });
        }

        showToast("Folder deleted", "info");
      } catch (err: any) {
        showToast(err.message || "Failed to delete folder", "error");
        throw err;
      } finally {
        setIsDeleting(false);
      }
    },
    [showToast]
  );

  return {
    foldersQuery: {
      data: {
        folders,
        rootSongsCount,
      },
      isLoading,
      isPending: isLoading,
      isError: false,
      error: null,
      refetch: async () => {},
    },
    createFolder,
    renameFolder,
    moveFolder,
    deleteFolder,
    isCreating,
    isRenaming,
    isMoving,
    isDeleting,
  };
}
