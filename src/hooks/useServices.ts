/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Service, ServiceElement, servicesApi } from "@hosanna/shared";
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
    onError: (err: Error) => {
      showToast(err.message || "Failed to create service", "error");
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) =>
      servicesApi.updateService(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["service", id] });
      const previousService = queryClient.getQueryData(["service", id]);
      queryClient.setQueryData(["service", id], (old: Service | undefined) => ({
        ...old,
        ...data,
      }));
      return { previousService };
    },
    onError: (err: Error, variables, context) => {
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
      queryClient.invalidateQueries({ queryKey: ["services", "archived"] });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => servicesApi.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["services", "archived"] });
      showToast("Service deleted", "info");
    },
    onError: (err: Error) => {
      showToast(err.message || "Failed to delete service", "error");
    },
  });

  const updateElementsMutation = useMutation({
    mutationFn: ({
      serviceId,
      data,
    }: {
      serviceId: string;
      data: { elements: ServiceElement[]; updatedAt: string };
    }) => servicesApi.updateServiceElements(serviceId, data),
    onMutate: async ({ serviceId, data }) => {
      await queryClient.cancelQueries({ queryKey: ["service", serviceId] });
      const previousService = queryClient.getQueryData(["service", serviceId]);
      queryClient.setQueryData(
        ["service", serviceId],
        (old: Service | undefined) =>
          old
            ? {
                ...old,
                elements: data.elements as Service["elements"],
              }
            : old,
      );
      return { previousService };
    },
    onError: (err: Error, variables, context) => {
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

  return {
    servicesQuery,
    createService: createServiceMutation.mutateAsync,
    updateService: updateServiceMutation.mutateAsync,
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
