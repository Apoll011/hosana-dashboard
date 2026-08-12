/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { foldersApi } from "@hosanna/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSync } from "../contexts/SyncContext";

export function useFolders() {
  const { showToast } = useSync();
  const queryClient = useQueryClient();

  const foldersQuery = useQuery({
    queryKey: ["folders"],
    queryFn: () => foldersApi.getFolders(),
    staleTime: 10000,
  });

  const createFolderMutation = useMutation({
    mutationFn: ({
      name,
      parentId,
    }: {
      name: string;
      parentId?: string | null;
    }) => foldersApi.createFolder(name, parentId),
    onSuccess: (newFolder) => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      showToast(`Folder "${newFolder.name}" created`, "success");
    },
    onError: (err: Error) => {
      showToast(err.message || "Failed to create folder", "error");
    },
  });

  const renameFolderMutation = useMutation({
    mutationFn: ({
      id,
      name,
      updatedAt,
    }: {
      id: string;
      name: string;
      updatedAt: string;
    }) => foldersApi.renameFolder(id, name, updatedAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      showToast("Folder renamed", "success");
    },
    onError: (err: Error) => {
      showToast(err.message || "Failed to rename folder", "error");
    },
  });

  const moveFolderMutation = useMutation({
    mutationFn: ({
      id,
      parentId,
      updatedAt,
    }: {
      id: string;
      parentId: string | null;
      updatedAt: string;
    }) => foldersApi.moveFolder(id, parentId, updatedAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      showToast("Folder moved", "success");
    },
    onError: (err: Error) => {
      showToast(err.message || "Failed to move folder", "error");
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "delete_songs" | "move_to_root";
    }) => foldersApi.deleteFolder(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      showToast("Folder deleted", "info");
    },
    onError: (err: Error) => {
      showToast(err.message || "Failed to delete folder", "error");
    },
  });

  return {
    foldersQuery,
    createFolder: createFolderMutation.mutateAsync,
    renameFolder: renameFolderMutation.mutateAsync,
    moveFolder: moveFolderMutation.mutateAsync,
    deleteFolder: deleteFolderMutation.mutateAsync,
    isCreating: createFolderMutation.isPending,
    isRenaming: renameFolderMutation.isPending,
    isMoving: moveFolderMutation.isPending,
    isDeleting: deleteFolderMutation.isPending,
  };
}
