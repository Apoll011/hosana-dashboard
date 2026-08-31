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
 * Responsibilities live *inside* their `AgendaEvent` (see
 * `AgendaEvent.responsibilities`), so every responsibility mutator takes an
 * `eventId` to know which event to update.
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
  const categories = useMemo(
    () => Object.values(state.categories),
    [state.categories],
  );

  const getEventsForDate = useCallback(
    (date: string) => events.filter((ev) => ev.date === date),
    [events],
  );

  const getResponsibilitiesForEvent = useCallback(
    (eventId: string) => state.events[eventId]?.responsibilities ?? [],
    [state.events],
  );

  /**
   * Manually-typed assignees (no `memberId`) used anywhere across all events,
   * deduped by name. Suggested by the assignee picker so users don't have to
   * retype a name for every event. Member-linked assignees are excluded here —
   * they're suggested from the org member list instead.
   */
  const manualAssignees = useMemo(() => {
    const seen = new Set<string>();
    const out: Assignee[] = [];
    for (const ev of events) {
      for (const r of ev.responsibilities) {
        for (const a of r.assignees) {
          if (a.memberId) continue;
          const key = a.name.trim().toLowerCase();
          if (!key || seen.has(key)) continue;
          seen.add(key);
          out.push(a);
        }
      }
    }
    return out;
  }, [events]);

  const addEvent = useCallback(
    (input: Omit<AgendaEvent, "id" | "reminder" | "responsibilities"> & {
      reminder?: ReminderSettings;
    }) => {
      const id = uid("evt");
      const event: AgendaEvent = {
        ...input,
        id,
        reminder: input.reminder ?? {
          enabled: false,
          label: "1 dia antes às 18:00",
        },
        responsibilities: [],
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
      const next = { ...prev.events };
      delete next[id];
      return { ...prev, events: next };
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
      const responsibility: Responsibility = { id, categoryId, assignees };
      setState((prev) => {
        const existing = prev.events[eventId];
        if (!existing) return prev;
        return {
          ...prev,
          events: {
            ...prev.events,
            [eventId]: {
              ...existing,
              responsibilities: [...existing.responsibilities, responsibility],
            },
          },
        };
      });
      return id;
    },
    [],
  );

  const updateResponsibilityAssignees = useCallback(
    (eventId: string, respId: string, assignees: Assignee[]) => {
      setState((prev) => {
        const existing = prev.events[eventId];
        if (!existing) return prev;
        return {
          ...prev,
          events: {
            ...prev.events,
            [eventId]: {
              ...existing,
              responsibilities: existing.responsibilities.map((r) =>
                r.id === respId ? { ...r, assignees } : r,
              ),
            },
          },
        };
      });
    },
    [],
  );

  const removeResponsibility = useCallback(
    (eventId: string, respId: string) => {
      setState((prev) => {
        const existing = prev.events[eventId];
        if (!existing) return prev;
        return {
          ...prev,
          events: {
            ...prev.events,
            [eventId]: {
              ...existing,
              responsibilities: existing.responsibilities.filter(
                (r) => r.id !== respId,
              ),
            },
          },
        };
      });
    },
    [],
  );

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
      // Drop responsibilities that referenced the deleted category from every
      // event, so no orphaned rows linger in the Agenda.
      const nextEvents = Object.fromEntries(
        Object.entries(prev.events).map(([evId, ev]) => [
          evId,
          {
            ...ev,
            responsibilities: ev.responsibilities.filter(
              (r) => r.categoryId !== id,
            ),
          },
        ]),
      );
      return { ...prev, categories: next, events: nextEvents };
    });
  }, []);

  const resetToMockData = useCallback(() => setState(MOCK_STATE), []);

  return {
    events,
    categories,
    manualAssignees,
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
