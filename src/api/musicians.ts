/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpClient } from './client';
import { MusicianToken } from '../types';

export interface CreateMusicianTokenParams {
  name: string;
  expiresAt?: string;
  allowedServices?: string[];
}

export const musiciansApi = {
  getTokens: async (): Promise<MusicianToken[]> => {
    return httpClient.request<MusicianToken[]>('/musicians/tokens');
  },

  createToken: async (params: CreateMusicianTokenParams): Promise<MusicianToken & { token: string; accessUrl: string; qrCode: string }> => {
    return httpClient.request<MusicianToken & { token: string; accessUrl: string; qrCode: string }>('/musicians/tokens', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  getTokenById: async (id: string): Promise<MusicianToken> => {
    return httpClient.request<MusicianToken>(`/musicians/tokens/${id}`);
  },

  updateToken: async (id: string, data: { name?: string; expiresAt?: string; allowedServices?: string[]; updatedAt: string }): Promise<MusicianToken> => {
    return httpClient.request<MusicianToken>(`/musicians/tokens/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  regenerateToken: async (id: string, updatedAt: string): Promise<MusicianToken & { token: string; accessUrl: string; qrCode: string }> => {
    return httpClient.request<MusicianToken & { token: string; accessUrl: string; qrCode: string }>(`/musicians/tokens/${id}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({ updatedAt }),
    });
  },

  revokeToken: async (id: string, updatedAt: string): Promise<MusicianToken> => {
    return httpClient.request<MusicianToken>(`/musicians/tokens/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ updatedAt }),
    });
  },

  deleteTokenPermanently: async (id: string): Promise<void> => {
    return httpClient.request<void>(`/musicians/tokens/${id}/permanent`, {
      method: 'DELETE',
    });
  },
};
