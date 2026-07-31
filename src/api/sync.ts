/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SyncStatusResponse } from "@hosanna/shared";
import { httpClient } from "./client";

export const syncApi = {
  getStatus: async (): Promise<SyncStatusResponse> => {
    return httpClient.request<SyncStatusResponse>("/sync/status");
  },
};
