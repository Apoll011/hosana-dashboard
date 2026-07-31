/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreateAdminParams } from "@hosanna/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminsApi } from "../api/admins";
import { useSync } from "../contexts/SyncContext";

export function useAdmins() {
  const { showToast } = useSync();
  const queryClient = useQueryClient();

  const adminsQuery = useQuery({
    queryKey: ["admins"],
    queryFn: () => adminsApi.getAdmins(),
    staleTime: 15000,
  });

  const pendingAdminsQuery = useQuery({
    queryKey: ["admins", "pending"],
    queryFn: () => adminsApi.getPendingAdmins(),
    staleTime: 15000,
  });

  const createAdminMutation = useMutation({
    mutationFn: (data: CreateAdminParams) => adminsApi.createAdmin(data),
    onSuccess: (newAdmin) => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      showToast(
        `Administrador "${newAdmin.name}" convidado com sucesso!`,
        "success",
      );
    },
    onError: (err: any) => {
      showToast(err.message || "Falha ao convidar administrador", "error");
    },
  });

  const approveAdminMutation = useMutation({
    mutationFn: (id: string) => adminsApi.approveAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["admins", "pending"] });
      showToast("Utilizador aprovado com sucesso!", "success");
    },
    onError: (err: any) => {
      showToast(err.message || "Falha ao aprovar utilizador", "error");
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: (id: string) => adminsApi.removeAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["admins", "pending"] });
      showToast("Utilizador removido com sucesso!", "info");
    },
    onError: (err: any) => {
      showToast(err.message || "Falha ao remover utilizador", "error");
    },
  });

  return {
    adminsQuery,
    pendingAdminsQuery,
    admins: adminsQuery.data || [],
    pendingAdmins: pendingAdminsQuery.data || [],
    createAdmin: createAdminMutation.mutateAsync,
    approveAdmin: approveAdminMutation.mutateAsync,
    removeAdmin: removeAdminMutation.mutateAsync,
    isCreating: createAdminMutation.isPending,
    isApproving: approveAdminMutation.isPending,
    isRemoving: removeAdminMutation.isPending,
  };
}
