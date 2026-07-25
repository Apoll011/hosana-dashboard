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

export function useSong(id: string | null) {
  return useQuery({
    queryKey: ['song', id],
    queryFn: () => (id ? songsApi.getSongById(id) : null),
    enabled: !!id,
  });
}
