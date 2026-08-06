/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Service, servicesApi } from "@hosanna/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSync } from "../contexts/SyncContext";

export function useServices() {
  const { showToast } = useSync();
  const queryClient = useQueryClient();

  const servicesQuery = useQuery({
    queryKey: ["services"],
    queryFn: () => servicesApi.getServices(),
  });

  const createServiceMutation = useMutation({
    mutationFn: (data: Partial<Service>) => servicesApi.createService(data),
    onSuccess: (newService) => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      showToast(`Service "${newService.name}" created`, "success");
    },
    onError: (err: any) => {
      showToast(err.message || "Failed to create service", "error");
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) =>
      servicesApi.updateService(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["service", id] });
      const previousService = queryClient.getQueryData(["service", id]);
      queryClient.setQueryData(["service", id], (old: any) => ({
        ...old,
        ...data,
      }));
      return { previousService };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousService) {
        queryClient.setQueryData(
          ["service", variables.id],
          context.previousService,
        );
      }
      showToast(err.message || "Failed to update service", "error");
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => servicesApi.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      showToast("Service deleted", "info");
    },
    onError: (err: any) => {
      showToast(err.message || "Failed to delete service", "error");
    },
  });

  const updateElementsMutation = useMutation({
    mutationFn: ({
      serviceId,
      data,
    }: {
      serviceId: string;
      data: { elements: any[]; updatedAt: string };
    }) => servicesApi.updateServiceElements(serviceId, data),
    onMutate: async ({ serviceId, data }) => {
      await queryClient.cancelQueries({ queryKey: ["service", serviceId] });
      const previousService = queryClient.getQueryData(["service", serviceId]);
      queryClient.setQueryData(["service", serviceId], (old: any) => ({
        ...old,
        elements: data.elements,
      }));
      return { previousService };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousService) {
        queryClient.setQueryData(
          ["service", variables.serviceId],
          context.previousService,
        );
      }
      showToast(err.message || "Failed to update elements", "error");
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["service", variables.serviceId],
      });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  const archiveServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) =>
      servicesApi.archiveService(id, data),
    onMutate: async ({ id, data }: { id: string; data: Partial<Service> }) => {
      await queryClient.cancelQueries({ queryKey: ["service", id] });
      const previousService = queryClient.getQueryData(["service", id]);
      queryClient.setQueryData(["service", id], (old: any) => ({
        ...old,
        archived: data?.archived,
      }));
      return { previousService };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousService) {
        queryClient.setQueryData(
          ["service", variables.id],
          context.previousService,
        );
      }
      showToast(err.message || "Failed to update service", "error");
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  return {
    servicesQuery,
    createService: createServiceMutation.mutateAsync,
    updateService: updateServiceMutation.mutateAsync,
    archiveService: archiveServiceMutation.mutateAsync,
    deleteService: deleteServiceMutation.mutateAsync,
    updateElements: updateElementsMutation.mutateAsync,
    isCreating: createServiceMutation.isPending,
    isUpdating: updateServiceMutation.isPending,
    isDeleting: deleteServiceMutation.isPending,
  };
}

export function useService(id: string | null) {
  return useQuery({
    queryKey: ["service", id],
    queryFn: () => (id ? servicesApi.getServiceById(id) : null),
    enabled: !!id,
  });
}
