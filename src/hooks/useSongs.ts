/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GetSongsParams, Song, songsApi } from "@hosanna/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSync } from "../contexts/SyncContext";

function useSongMutations() {
  const { showToast } = useSync();
  const queryClient = useQueryClient();

  const createSongMutation = useMutation({
    mutationFn: (data: Partial<Song>) => songsApi.createSong(data),
    onSuccess: (newSong) => {
      // Invalida todas as queries que começam por ['songs']
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      showToast(`Cântico "${newSong.title}" criado com sucesso!`, "success");
    },
    onError: (err: any) => {
      showToast(err.message || "Falha ao criar cântico", "error");
    },
  });

  function updateSong(updatedSong: Song) {
    queryClient.setQueryData(["song", updatedSong.id], updatedSong);

    queryClient.setQueriesData({ queryKey: ["songs"] }, (oldData: any) => {
      if (!oldData || !Array.isArray(oldData.songs)) {
        return oldData;
      }

      return {
        ...oldData,
        songs: oldData.songs.map((song: Song) =>
          song.id === updatedSong.id ? updatedSong : song,
        ),
      };
    });
  }

  const updateSongMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Song> }) =>
      songsApi.updateSong(id, data),
    onSuccess: (updatedSong) => {
      updateSong(updatedSong);
      showToast(`Cântico "${updatedSong.title}" guardado`, "success");
    },
    onError: (err: any) => {
      showToast(err.message || "Falha ao guardar cântico", "error");
    },
  });

  const deleteSongMutation = useMutation({
    mutationFn: (id: string) => songsApi.deleteSong(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      showToast("Cântico apagado", "info");
    },
    onError: (err: any) => {
      showToast(err.message || "Falha ao apagar cântico", "error");
    },
  });

  const moveSongMutation = useMutation({
    mutationFn: ({
      id,
      folderId,
      updatedAt,
      newPath,
    }: {
      id: string;
      folderId: string | null;
      updatedAt: string;
      newPath?: string;
    }) => songsApi.moveSong(id, folderId, updatedAt, newPath),
    onSuccess: (updatedSong) => {
      updateSong(updatedSong);
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      showToast("Cântico movido", "success");
    },
    onError: (err: any) => {
      showToast(err.message || "Falha ao mover cântico", "error");
    },
  });

  const updateBatchTagsMutation = useMutation({
    mutationFn: (params: {
      songIds: string[];
      tags: string[];
      mode?: "append" | "replace" | "remove";
    }) => songsApi.updateBatchTags(params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      showToast(
        `Etiquetas atualizadas em ${data.count} cântico(s)!`,
        "success",
      );
    },
    onError: (err: any) => {
      showToast(err.message || "Falha ao atualizar etiquetas em lote", "error");
    },
  });

  return {
    createSong: createSongMutation.mutateAsync,
    updateSong: updateSongMutation.mutateAsync,
    deleteSong: deleteSongMutation.mutateAsync,
    moveSong: moveSongMutation.mutateAsync,
    updateBatchTags: updateBatchTagsMutation.mutateAsync,
    isCreating: createSongMutation.isPending,
    isUpdating: updateSongMutation.isPending,
    isDeleting: deleteSongMutation.isPending,
    isUpdatingBatchTags: updateBatchTagsMutation.isPending,
  };
}

export function useSongs(params: GetSongsParams = {}) {
  const { setSyncStatus } = useSync();
  const mutations = useSongMutations();

  const songsQuery = useQuery({
    queryKey: ["songs", params],
    queryFn: async () => {
      setSyncStatus("syncing");
      try {
        const res = await songsApi.getSongs(params);
        setSyncStatus("synced");
        return res;
      } catch (err: any) {
        setSyncStatus("error");
        throw err;
      }
    },
    staleTime: 10000,
  });

  return { songsQuery, ...mutations };
}

export function useAllSongs(params: GetSongsParams = {}) {
  const { setSyncStatus } = useSync();
  const queryClient = useQueryClient();
  const mutations = useSongMutations();

  const songsQuery = useQuery({
    // Usamos 'all' na queryKey para não colidir com a query paginada,
    // mas começando por 'songs' garante que as mutações a invalidam automaticamente.
    queryKey: ["songs", "all", params],
    queryFn: async () => {
      setSyncStatus("syncing");
      try {
        const existingData: any = queryClient.getQueryData([
          "songs",
          "all",
          params,
        ]);
        const isInitialLoad =
          !existingData ||
          !existingData.songs ||
          existingData.songs.length === 0;

        // 1. Pede a primeira página
        const firstPage = await songsApi.getSongs({
          ...params,
          page: 1,
          limit: 200,
        });

        if (isInitialLoad) {
          queryClient.setQueryData(["songs", "all", params], firstPage);
        }

        let apiSongs = [...firstPage.songs];

        // 2. Continua a pedir o resto se houver mais de uma página
        if (firstPage.totalPages && firstPage.totalPages > 1) {
          const remainingPages = await Promise.all(
            Array.from({ length: firstPage.totalPages - 1 }, (_, i) =>
              songsApi
                .getSongs({ ...params, page: i + 2, limit: 200 })
                .then((pageData) => {
                  if (isInitialLoad) {
                    // Injeta os cânticos na cache para aparecerem progressivamente
                    queryClient.setQueryData(
                      ["songs", "all", params],
                      (oldData: any) => {
                        if (!oldData) return oldData;
                        return {
                          ...oldData,
                          songs: [...oldData.songs, ...pageData.songs],
                        };
                      },
                    );
                  }
                  return pageData;
                }),
            ),
          );

          apiSongs = [...firstPage.songs];
          remainingPages.forEach((page) => apiSongs.push(...page.songs));
        }

        setSyncStatus("synced");
        return { ...firstPage, songs: apiSongs };
      } catch (err: any) {
        setSyncStatus("error");
        throw err;
      }
    },
    staleTime: 10000,
  });

  return { songsQuery, ...mutations };
}

export function useSong(id: string | null) {
  return useQuery({
    queryKey: ["song", id],
    queryFn: () => (id ? songsApi.getSongById(id) : null),
    enabled: !!id,
  });
}
