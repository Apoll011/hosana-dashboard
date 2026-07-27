/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpClient } from './client';
import { ServerSettings } from '../types';

export const settingsApi = {
  getSettings: async (): Promise<ServerSettings> => {
    return httpClient.request<ServerSettings>('/settings');
  },

  updateSettings: async (settings: Partial<ServerSettings>): Promise<ServerSettings> => {
    return httpClient.request<ServerSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  downloadBackup: async (): Promise<void> => {
    const res = await fetch(`${httpClient.getBaseURL()}/backup`, {
      headers: {
        'Authorization': `Bearer ${httpClient.getToken()}`
      }
    });
    if (!res.ok) throw new Error('Failed to export backup');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hosanna_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  restoreBackup: async (backupData: any): Promise<{ message: string; counts: Record<string, number> }> => {
    return httpClient.request<{ message: string; counts: Record<string, number> }>('/backup/restore', {
      method: 'POST',
      body: JSON.stringify(backupData),
    });
  },

  getHealth: async (): Promise<{ status: string; timestamp: string }> => {
    return httpClient.request<{ status: string; timestamp: string }>('/health');
  },
};
