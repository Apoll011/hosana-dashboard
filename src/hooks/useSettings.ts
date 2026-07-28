/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings';
import { ServerSettings } from '../types';
import { useSync } from '../contexts/SyncContext';

export function useSettings() {
  const { showToast } = useSync();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getSettings(),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Partial<ServerSettings>) => settingsApi.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      showToast('Definições do servidor guardadas com sucesso!', 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Falha ao guardar definições do servidor', 'error');
    },
  });

  return {
    settingsQuery,
    updateSettings: updateSettingsMutation.mutateAsync,
    isUpdating: updateSettingsMutation.isPending,
  };
}
