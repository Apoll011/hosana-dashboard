/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { musiciansApi, CreateMusicianTokenParams } from '../api/musicians';
import { useSync } from '../contexts/SyncContext';

export function useMusicians() {
  const { showToast } = useSync();
  const queryClient = useQueryClient();

  const tokensQuery = useQuery({
    queryKey: ['musicianTokens'],
    queryFn: () => musiciansApi.getTokens(),
  });

  const createTokenMutation = useMutation({
    mutationFn: (params: CreateMusicianTokenParams) => musiciansApi.createToken(params),
    onSuccess: (newToken) => {
      queryClient.invalidateQueries({ queryKey: ['musicianTokens'] });
      showToast(`Musician token "${newToken.name}" generated!`, 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to generate token', 'error');
    },
  });

  const revokeTokenMutation = useMutation({
    mutationFn: ({ id, updatedAt }: { id: string; updatedAt: string }) =>
      musiciansApi.revokeToken(id, updatedAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musicianTokens'] });
      showToast('Musician token revoked', 'info');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to revoke token', 'error');
    },
  });

  const regenerateTokenMutation = useMutation({
    mutationFn: ({ id, updatedAt }: { id: string; updatedAt: string }) =>
      musiciansApi.regenerateToken(id, updatedAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musicianTokens'] });
      showToast('Musician token regenerated', 'success');
    },
    onError: (err: any) => showToast(err.message || 'Failed to regenerate token', 'error'),
  });

  const deleteTokenPermanentlyMutation = useMutation({
    mutationFn: (id: string) => musiciansApi.deleteTokenPermanently(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musicianTokens'] });
      showToast('Musician token deleted permanently', 'info');
    },
    onError: (err: any) => showToast(err.message || 'Failed to delete token', 'error'),
  });

  return {
    tokensQuery,
    createToken: createTokenMutation.mutateAsync,
    revokeToken: revokeTokenMutation.mutateAsync,
    regenerateToken: regenerateTokenMutation.mutateAsync,
    deleteTokenPermanently: deleteTokenPermanentlyMutation.mutateAsync,
    isCreating: createTokenMutation.isPending,
    isRevoking: revokeTokenMutation.isPending,
  };
}
