/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpClient } from './client';
import { SyncStatusResponse } from '../types';

export const syncApi = {
  getStatus: async (): Promise<SyncStatusResponse> => {
    return httpClient.request<SyncStatusResponse>('/sync/status');
  },
};
