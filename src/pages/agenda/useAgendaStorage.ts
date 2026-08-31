/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { MOCK_STATE } from "./mockData";
import {
  AgendaState,
  Assignee,
  ReminderSettings,
  Responsibility,
  ResponsibilityCategory,
  AgendaService,
} from "./types";

const STORAGE_KEY = "hosanna:agenda:v1";

function loadState(): AgendaState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return MOCK_STATE;
    return JSON.parse(raw) as AgendaState;
  } catch {
    return MOCK_STATE;
  }
}

function persist(state: AgendaState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can fail (private mode, quota, etc.) — silently no-op.
    // This is exactly the kind of thing a real backend call would replace.
  }
}

const uid = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Everything the Agenda UI needs to read/write its data.
 *
 * ── Swapping this for a real backend later ──────────────────────────────
 * Every mutator below follows the same shape: update local state, then
 * `persist()`. To move to Prisma/RxDB/whatever, keep the function
 * signatures the same and replace the body (e.g. call your API / mutate
 * your sync engine instead of `setState` + `persist`). Nothing in the
 * components needs to change.
 */
export function useAgendaStorage() {
  const [state, setState] = useState<AgendaState>(() => loadState());

  useEffect(() => {
    persist(state);
  }, [state]);

  const services = useMemo(() => Object.values(state.services), [state.services]);
  const responsibilities = useMemo(
    () => Object.values(state.responsibilities),
    [state.responsibilities],
  );
  const categories = useMemo(
    () => Object.values(state.categories),
    [state.categories],
  );

  const getServicesForDate = useCallback(
    (date: string) => services.filter((s) => s.date === date),
    [services],
  );

  const getResponsibilitiesForService = useCallback(
    (serviceId: string) =>
      responsibilities.filter((r) => r.serviceId === serviceId),
    [responsibilities],
  );

  const addService = useCallback(
    (input: Omit<AgendaService, "id" | "reminder"> & { reminder?: ReminderSettings }) => {
      const id = uid("svc");
      const service: AgendaService = {
        ...input,
        id,
        reminder: input.reminder ?? {
          enabled: false,
          label: "1 dia antes às 18:00",
        },
      };
      setState((prev) => ({
        ...prev,
        services: { ...prev.services, [id]: service },
      }));
      return id;
    },
    [],
  );

  const updateService = useCallback((id: string, patch: Partial<AgendaService>) => {
    setState((prev) => {
      const existing = prev.services[id];
      if (!existing) return prev;
      return {
        ...prev,
        services: { ...prev.services, [id]: { ...existing, ...patch } },
      };
    });
  }, []);

  const deleteService = useCallback((id: string) => {
    setState((prev) => {
      const nextServices = { ...prev.services };
      delete nextServices[id];
      const nextResp = Object.fromEntries(
        Object.entries(prev.responsibilities).filter(
          ([, r]) => r.serviceId !== id,
        ),
      );
      return { ...prev, services: nextServices, responsibilities: nextResp };
    });
  }, []);

  const updateReminder = useCallback(
    (serviceId: string, reminder: ReminderSettings) => {
      updateService(serviceId, { reminder });
    },
    [updateService],
  );

  const addResponsibility = useCallback(
    (serviceId: string, categoryId: string, assignees: Assignee[] = []) => {
      const id = uid("resp");
      const responsibility: Responsibility = {
        id,
        serviceId,
        categoryId,
        assignees,
      };
      setState((prev) => ({
        ...prev,
        responsibilities: { ...prev.responsibilities, [id]: responsibility },
      }));
      return id;
    },
    [],
  );

  const updateResponsibilityAssignees = useCallback(
    (id: string, assignees: Assignee[]) => {
      setState((prev) => {
        const existing = prev.responsibilities[id];
        if (!existing) return prev;
        return {
          ...prev,
          responsibilities: {
            ...prev.responsibilities,
            [id]: { ...existing, assignees },
          },
        };
      });
    },
    [],
  );

  const removeResponsibility = useCallback((id: string) => {
    setState((prev) => {
      const next = { ...prev.responsibilities };
      delete next[id];
      return { ...prev, responsibilities: next };
    });
  }, []);

  const addCategory = useCallback((category: Omit<ResponsibilityCategory, "id">) => {
    const id = uid("cat");
    setState((prev) => ({
      ...prev,
      categories: { ...prev.categories, [id]: { ...category, id } },
    }));
    return id;
  }, []);

  const removeCategory = useCallback((id: string) => {
    setState((prev) => {
      const next = { ...prev.categories };
      delete next[id];
      return { ...prev, categories: next };
    });
  }, []);

  const resetToMockData = useCallback(() => setState(MOCK_STATE), []);

  return {
    services,
    responsibilities,
    categories,
    getServicesForDate,
    getResponsibilitiesForService,
    addService,
    updateService,
    deleteService,
    updateReminder,
    addResponsibility,
    updateResponsibilityAssignees,
    removeResponsibility,
    addCategory,
    removeCategory,
    resetToMockData,
  };
}

export type UseAgendaStorageReturn = ReturnType<typeof useAgendaStorage>;
