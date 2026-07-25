/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpClient } from './client';
import { Service } from '../types';

export const servicesApi = {
  getServices: async (): Promise<Service[]> => {
    return httpClient.request<Service[]>('/services');
  },

  getServiceById: async (id: string): Promise<Service> => {
    return httpClient.request<Service>(`/services/${id}`);
  },

  createService: async (data: Partial<Service>): Promise<Service> => {
    return httpClient.request<Service>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateService: async (id: string, data: Partial<Service>): Promise<Service> => {
    return httpClient.request<Service>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteService: async (id: string): Promise<void> => {
    return httpClient.request<void>(`/services/${id}`, {
      method: 'DELETE',
    });
  },

  addSongToService: async (serviceId: string, data: { songId: string; notes?: string; position?: number; updatedAt: string }): Promise<Service> => {
    return httpClient.request<Service>(`/services/${serviceId}/songs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  removeSongFromService: async (serviceId: string, songId: string, updatedAt: string): Promise<Service> => {
    return httpClient.request<Service>(`/services/${serviceId}/songs/${songId}`, {
      method: 'DELETE',
      body: JSON.stringify({ updatedAt }),
    });
  },

  reorderServiceSongs: async (serviceId: string, data: { orderedSongIds: string[]; updatedAt: string }): Promise<Service> => {
    return httpClient.request<Service>(`/services/${serviceId}/songs/reorder`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  moveServiceSong: async (serviceId: string, songId: string, data: { targetIndex: number; updatedAt: string }): Promise<Service> => {
    return httpClient.request<Service>(`/services/${serviceId}/songs/${songId}/move`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateServiceNotes: async (serviceId: string, data: { notes: string; updatedAt: string }): Promise<Service> => {
    return httpClient.request<Service>(`/services/${serviceId}/notes`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateServiceSongNotes: async (serviceId: string, songId: string, data: { notes: string; updatedAt: string }): Promise<Service> => {
    return httpClient.request<Service>(`/services/${serviceId}/songs/${songId}/notes`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
