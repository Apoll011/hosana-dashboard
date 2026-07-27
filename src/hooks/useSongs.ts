/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { songsApi, GetSongsParams } from '../api/songs';
import { Song } from '../types';
import { useSync } from '../contexts/SyncContext';

export function useSongs(params: GetSongsParams = {}) {
  const { showToast, setSyncStatus } = useSync();
  const queryClient = useQueryClient();

  const songsQuery = useQuery({
    queryKey: ['songs', params],
    queryFn: async () => {
      setSyncStatus('syncing');
      try {
        const res = await songsApi.getSongs(params);
        setSyncStatus('synced');
        return res;
      } catch (err: any) {
        setSyncStatus('error');
        throw err;
      }
    },
    staleTime: 10000,
  });

  const createSongMutation = useMutation({
    mutationFn: (data: Partial<Song>) => songsApi.createSong(data),
    onSuccess: (newSong) => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      showToast(`Song "${newSong.title}" created successfully!`, 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to create song', 'error');
    },
  });

  const updateSongMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Song> }) => songsApi.updateSong(id, data),
    onSuccess: (updatedSong) => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      queryClient.invalidateQueries({ queryKey: ['song', updatedSong.id] });
      showToast(`Song "${updatedSong.title}" saved`, 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to save song', 'error');
    },
  });

  const deleteSongMutation = useMutation({
    mutationFn: (id: string) => songsApi.deleteSong(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      showToast('Song deleted', 'info');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to delete song', 'error');
    },
  });

  const renameSongMutation = useMutation({
    mutationFn: ({ id, newTitle, updatedAt, newPath }: { id: string; newTitle: string; updatedAt: string; newPath?: string }) =>
      songsApi.renameSong(id, newTitle, updatedAt, newPath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      showToast('Song renamed', 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to rename song', 'error');
    },
  });

  const moveSongMutation = useMutation({
    mutationFn: ({ id, folderId, updatedAt, newPath }: { id: string; folderId: string | null; updatedAt: string; newPath?: string }) =>
      songsApi.moveSong(id, folderId, updatedAt, newPath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      showToast('Song moved to folder', 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to move song', 'error');
    },
  });

  const updateBatchTagsMutation = useMutation({
    mutationFn: (params: { songIds: string[]; tags: string[]; mode?: 'append' | 'replace' | 'remove' }) =>
      songsApi.updateBatchTags(params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      showToast(`Etiquetas atualizadas em ${data.count} cântico(s)!`, 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Falha ao atualizar etiquetas em lote', 'error');
    },
  });

  return {
    songsQuery,
    createSong: createSongMutation.mutateAsync,
    updateSong: updateSongMutation.mutateAsync,
    deleteSong: deleteSongMutation.mutateAsync,
    renameSong: renameSongMutation.mutateAsync,
    moveSong: moveSongMutation.mutateAsync,
    updateBatchTags: updateBatchTagsMutation.mutateAsync,
    isCreating: createSongMutation.isPending,
    isUpdating: updateSongMutation.isPending,
    isDeleting: deleteSongMutation.isPending,
    isUpdatingBatchTags: updateBatchTagsMutation.isPending,
  };
}

export function useAllSongs(params: GetSongsParams = {}) {
  const { setSyncStatus } = useSync();
  const queryClient = useQueryClient();
  const mutations = useSongMutations();

  const songsQuery = useQuery({
    queryKey: ['songs', 'all', params],
    queryFn: async () => {
      setSyncStatus('syncing');
      try {
        const existingData: any = queryClient.getQueryData(['songs', 'all', params]);
        const isInitialLoad = !existingData || !existingData.songs || existingData.songs.length === 0;

        // 1. Pede a primeira página
        const firstPage = await songsApi.getSongs({ ...params, page: 1, limit: 200 });
        
        if (isInitialLoad) {
          queryClient.setQueryData(['songs', 'all', params], firstPage);
        }

        let apiSongs = [...firstPage.songs];

        // 2. Continua a pedir o resto se houver mais de uma página
        if (firstPage.totalPages && firstPage.totalPages > 1) {
          const remainingPages = await Promise.all(
            Array.from({ length: firstPage.totalPages - 1 }, (_, i) =>
              songsApi.getSongs({ ...params, page: i + 2, limit: 200 }).then(pageData => {
                
                if (isInitialLoad) {
                  // Injeta os cânticos na cache para aparecerem progressivamente
                  queryClient.setQueryData(['songs', 'all', params], (oldData: any) => {
                    if (!oldData) return oldData;
                    return {
                      ...oldData,
                      songs: [...oldData.songs, ...pageData.songs]
                    };
                  });
                }
                return pageData;
              })
            )
          );
          
          apiSongs = [...firstPage.songs];
          remainingPages.forEach(page => apiSongs.push(...page.songs));
        }

        setSyncStatus('synced');
        return { ...firstPage, songs: apiSongs };
      } catch (err: any) {
        setSyncStatus('error');
        throw err;
      }
    },
    staleTime: 10000,
  });

  return { songsQuery, ...mutations };
}

export function useSong(id: string | null) {
  return useQuery({
    queryKey: ['song', id],
    queryFn: () => (id ? songsApi.getSongById(id) : null),
    enabled: !!id,
  });
}
