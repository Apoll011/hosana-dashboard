/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpClient } from './client';
import { AdminUser, CreateAdminParams } from '../types';

export const adminsApi = {
  getAdmins: async (): Promise<AdminUser[]> => {
    return httpClient.request<AdminUser[]>('/tenants/admins');
  },

  getPendingAdmins: async (): Promise<AdminUser[]> => {
    return httpClient.request<AdminUser[]>('/tenants/admins/pending');
  },

  createAdmin: async (params: CreateAdminParams): Promise<AdminUser> => {
    return httpClient.request<AdminUser>('/tenants/admins', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  approveAdmin: async (id: string): Promise<{ message: string; user: AdminUser }> => {
    return httpClient.request<{ message: string; user: AdminUser }>(`/tenants/admins/${id}/approve`, {
      method: 'PUT',
    });
  },

  removeAdmin: async (id: string): Promise<{ message: string }> => {
    return httpClient.request<{ message: string }>(`/tenants/admins/${id}`, {
      method: 'DELETE',
    });
  },
};
