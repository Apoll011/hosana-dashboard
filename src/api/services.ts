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



  updateServiceElements: async (serviceId: string, data: { elements: any[]; updatedAt: string }): Promise<Service> => {
    return httpClient.request<Service>(`/services/${serviceId}/elements`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
