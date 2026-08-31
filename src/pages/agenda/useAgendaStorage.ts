/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { MOCK_STATE } from "./mockData";
import {
  AgendaState,
  AgendaEvent,
  Assignee,
  ReminderSettings,
  Responsibility,
  ResponsibilityCategory,
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

  const events = useMemo(() => Object.values(state.events), [state.events]);
  const responsibilities = useMemo(
    () => Object.values(state.responsibilities),
    [state.responsibilities],
  );
  const categories = useMemo(
    () => Object.values(state.categories),
    [state.categories],
  );

  const getEventsForDate = useCallback(
    (date: string) => events.filter((ev) => ev.date === date),
    [events],
  );

  const getResponsibilitiesForEvent = useCallback(
    (eventId: string) =>
      responsibilities.filter((r) => r.eventId === eventId),
    [responsibilities],
  );

  const addEvent = useCallback(
    (input: Omit<AgendaEvent, "id" | "reminder"> & { reminder?: ReminderSettings }) => {
      const id = uid("evt");
      const event: AgendaEvent = {
        ...input,
        id,
        reminder: input.reminder ?? {
          enabled: false,
          label: "1 dia antes às 18:00",
        },
      };
      setState((prev) => ({
        ...prev,
        events: { ...prev.events, [id]: event },
      }));
      return id;
    },
    [],
  );

  const updateEvent = useCallback((id: string, patch: Partial<AgendaEvent>) => {
    setState((prev) => {
      const existing = prev.events[id];
      if (!existing) return prev;
      return {
        ...prev,
        events: { ...prev.events, [id]: { ...existing, ...patch } },
      };
    });
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setState((prev) => {
      const nextEvents = { ...prev.events };
      delete nextEvents[id];
      const nextResp = Object.fromEntries(
        Object.entries(prev.responsibilities).filter(
          ([, r]) => r.eventId !== id,
        ),
      );
      return { ...prev, events: nextEvents, responsibilities: nextResp };
    });
  }, []);

  const updateReminder = useCallback(
    (eventId: string, reminder: ReminderSettings) => {
      updateEvent(eventId, { reminder });
    },
    [updateEvent],
  );

  const addResponsibility = useCallback(
    (eventId: string, categoryId: string, assignees: Assignee[] = []) => {
      const id = uid("resp");
      const responsibility: Responsibility = {
        id,
        eventId,
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
      // Remove responsibilities that referenced the deleted category so no
      // orphaned rows linger on events in the Agenda.
      const nextResp = Object.fromEntries(
        Object.entries(prev.responsibilities).filter(
          ([, r]) => r.categoryId !== id,
        ),
      );
      return { ...prev, categories: next, responsibilities: nextResp };
    });
  }, []);

  const resetToMockData = useCallback(() => setState(MOCK_STATE), []);

  return {
    events,
    responsibilities,
    categories,
    getEventsForDate,
    getResponsibilitiesForEvent,
    addEvent,
    updateEvent,
    deleteEvent,
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
