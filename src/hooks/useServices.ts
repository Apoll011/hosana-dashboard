/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '../api/services';
import { Service } from '../types';
import { useSync } from '../contexts/SyncContext';

export function useServices() {
  const { showToast } = useSync();
  const queryClient = useQueryClient();

  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getServices(),
  });

  const createServiceMutation = useMutation({
    mutationFn: (data: Partial<Service>) => servicesApi.createService(data),
    onSuccess: (newService) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      showToast(`Service "${newService.name}" created`, 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to create service', 'error');
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) =>
      servicesApi.updateService(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service', updated.id] });
      showToast('Service updated successfully', 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to update service', 'error');
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => servicesApi.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      showToast('Service deleted', 'info');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to delete service', 'error');
    },
  });

  const addSongMutation = useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: string; data: { songId: string; notes?: string; position?: number; updatedAt: string } }) =>
      servicesApi.addSongToService(serviceId, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['service', updated.id] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (err: any) => showToast(err.message || 'Failed to add song', 'error'),
  });

  const removeSongMutation = useMutation({
    mutationFn: ({ serviceId, songId, updatedAt }: { serviceId: string; songId: string; updatedAt: string }) =>
      servicesApi.removeSongFromService(serviceId, songId, updatedAt),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['service', updated.id] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (err: any) => showToast(err.message || 'Failed to remove song', 'error'),
  });

  const updateNotesMutation = useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: string; data: { notes: string; updatedAt: string } }) =>
      servicesApi.updateServiceNotes(serviceId, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['service', updated.id] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      showToast('Service notes saved', 'success');
    },
    onError: (err: any) => showToast(err.message || 'Failed to update notes', 'error'),
  });

  const updateSongNotesMutation = useMutation({
    mutationFn: ({ serviceId, songId, data }: { serviceId: string; songId: string; data: { notes: string; updatedAt: string } }) =>
      servicesApi.updateServiceSongNotes(serviceId, songId, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['service', updated.id] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (err: any) => showToast(err.message || 'Failed to update song notes', 'error'),
  });

  const reorderSongsMutation = useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: string; data: { orderedSongIds: string[]; updatedAt: string } }) =>
      servicesApi.reorderServiceSongs(serviceId, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['service', updated.id] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (err: any) => showToast(err.message || 'Failed to reorder songs', 'error'),
  });

  const updateElementsMutation = useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: string; data: { elements: any[]; updatedAt: string } }) =>
      servicesApi.updateServiceElements(serviceId, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['service', updated.id] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      showToast('Service elements saved', 'success');
    },
    onError: (err: any) => showToast(err.message || 'Failed to update elements', 'error'),
  });

  return {
    servicesQuery,
    createService: createServiceMutation.mutateAsync,
    updateService: updateServiceMutation.mutateAsync,
    deleteService: deleteServiceMutation.mutateAsync,
    addSong: addSongMutation.mutateAsync,
    removeSong: removeSongMutation.mutateAsync,
    updateNotes: updateNotesMutation.mutateAsync,
    updateSongNotes: updateSongNotesMutation.mutateAsync,
    updateElements: updateElementsMutation.mutateAsync,
    reorderSongs: reorderSongsMutation.mutateAsync,
    isCreating: createServiceMutation.isPending,
    isUpdating: updateServiceMutation.isPending,
    isDeleting: deleteServiceMutation.isPending,
  };
}

export function useService(id: string | null) {
  return useQuery({
    queryKey: ['service', id],
    queryFn: () => (id ? servicesApi.getServiceById(id) : null),
    enabled: !!id,
  });
}
