/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpClient } from './client';
import { Tenant, User } from '../types';

export interface LoginParams {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: async (credentials: LoginParams): Promise<LoginResponse> => {
    const data = await httpClient.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    httpClient.setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  registerTenant: async (params: {
    tenantName: string;
    tenantSlug: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    serverUrl?: string;
  }): Promise<any> => {
    if (params.serverUrl) {
      httpClient.setBaseURL(params.serverUrl);
    }
    return httpClient.request('/tenants/register', {
      method: 'POST',
      body: JSON.stringify({
        tenantName: params.tenantName,
        tenantSlug: params.tenantSlug,
        adminName: params.adminName,
        adminEmail: params.adminEmail,
        adminPassword: params.adminPassword,
      }),
    });
  },

  getCurrentTenant: async (): Promise<Tenant> => {
      return httpClient.request<Tenant>('/tenants/me');
  },

  registerUser: async (params: {
    tenantSlug: string;
    name: string;
    email: string;
    password: string;
  }): Promise<{ message: string; isApproved: boolean; user: User }> => {
    return httpClient.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        tenantSlug: params.tenantSlug,
        name: params.name,
        email: params.email,
        password: params.password,
      }),
    });
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    return httpClient.request<{ user: User }>('/auth/me');
  },

  logout: async (): Promise<void> => {
    try {
      await httpClient.request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      httpClient.setTokens(null, null);
    }
  },
};
