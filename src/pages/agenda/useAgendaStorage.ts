/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useOrgSettings } from "../../hooks/useOrgSettings";
import { MOCK_STATE } from "./mockData";
import {
  AgendaState,
  AgendaEvent,
  Assignee,
  ReminderSettings,
  Responsibility,
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
 * Two sources of truth:
 * - **Events** (with their embedded responsibilities) live in localStorage
 *   under `hosanna:agenda:v1`, seeded from `MOCK_STATE` the first time.
 * - **Responsibility categories** are org-wide and live in the org metadata
 *   (Settings → General → Responsabilidades) — they're read from
 *   `useOrgSettings` here, never persisted by this hook.
 *
 * ── Swapping this for a real backend later ──────────────────────────────
 * Every mutator below follows the same shape: update local state, then
 * `persist()`. To move to Prisma/RxDB/whatever, keep the function
 * signatures the same and replace the body (e.g. call your API / mutate
 * your sync engine instead of `setState` + `persist`). Nothing in the
 * components needs to change.
 */
export function useAgendaStorage() {
  const { organization } = useAuth();
  const { settings, savedSettings } = useOrgSettings();

  const [state, setState] = useState<AgendaState>(() => loadState());

  useEffect(() => {
    persist(state);
  }, [state]);

  const events = useMemo(() => Object.values(state.events), [state.events]);
  const categories = settings.agenda.responsibilityCategories;

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

  // Categories that are actually persisted in the org metadata. The Agenda's
  // own instance of useOrgSettings never mutates, so this equals `settings`
  // here — but using the persisted set keeps the cleanup honest even if a
  // draft were ever introduced.
  const persistedCategoryIds = useMemo(
    () =>
      new Set(
        savedSettings.agenda.responsibilityCategories.map((c) => c.id),
      ),
    [savedSettings.agenda.responsibilityCategories],
  );

  /**
   * Scrub responsibilities whose category no longer exists in the org
   * metadata (e.g. it was deleted in Settings → General → Responsabilidades).
   * Runs on mount and whenever the persisted categories change, so it also
   * catches deletes that happened while the Agenda page was closed. Skips
   * until the org is loaded to avoid reacting to the default pre-load state.
   */
  useEffect(() => {
    if (!organization) return;
    setState((prev) => {
      let changed = false;
      const nextEvents: AgendaState["events"] = {};
      for (const [evId, ev] of Object.entries(prev.events)) {
        const kept = ev.responsibilities.filter((r) =>
          persistedCategoryIds.has(r.categoryId),
        );
        if (kept.length !== ev.responsibilities.length) changed = true;
        nextEvents[evId] = { ...ev, responsibilities: kept };
      }
      return changed ? { ...prev, events: nextEvents } : prev;
    });
  }, [organization, persistedCategoryIds]);

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
    resetToMockData,
  };
}

export type UseAgendaStorageReturn = ReturnType<typeof useAgendaStorage>;
