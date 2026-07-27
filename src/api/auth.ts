/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpClient } from './client';
import { User } from '../types';

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
