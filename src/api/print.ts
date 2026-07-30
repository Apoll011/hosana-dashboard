/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpClient } from './client';

type PrintModelType = 'service' | 'folder' | 'song';


interface Template {
        id: string;
        model: PrintModelType;
        name: string;
        description: string;
        defaultSettings: Record<string, any>;
}

interface UpdateTemplateSettings {
    model: PrintModelType;
    templateId: string;
    settings: Record<string, any>;
}

interface Templates {
    activeSettings: {
        service: {
            id: string;
            config: Record<string, any>;
        };
        folder: {
            id: string;
            config: Record<string, any>;
        };
        song: {
            id: string;
            config: Record<string, any>;
        };
    };
    registry: Template[];
}

export const printApi = {
  printService: async (serviceId: string): Promise<string> => {
    return (await httpClient.request_raw(`/print/services/${serviceId}`)).text();
  },

  printSong: async (songId: string): Promise<string> => {
    return (await httpClient.request_raw(`/print/songs/${songId}`)).text();
  },

  printFolder: async (folderId: string): Promise<string> => {
    return (await httpClient.request_raw(`/print/folders/${folderId}`)).text();
  },

  templates: async (): Promise<Templates> => {
    return httpClient.request('/print/templates/');
  },

  setSettings: async (options: UpdateTemplateSettings): Promise<{ sucess: boolean }> => {
    return httpClient.request(`/print/settings`, {
      method: 'PUT',
      body: JSON.stringify(options)
    });
  },
};
