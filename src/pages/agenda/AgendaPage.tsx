/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DayAgendaList } from "@/src/components/agenda/DayAgendaList";
import { DetailsSidebar } from "@/src/components/agenda/DetailsSidebar";
import { EventDetailPanel } from "@/src/components/agenda/EventDetailPanel";
import {
  AddResponsibilityModal,
  EditAssigneesModal,
  EditReminderModal,
  EventFormModal,
  EventFormValue,
} from "@/src/components/agenda/EventModals";
import { MiniCalendar, toIso } from "@/src/components/agenda/MiniCalendar";
import { CalendarPlus } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useAgendaStorage } from "./useAgendaStorage";

export const AgendaPage: React.FC = () => {
  const store = useAgendaStorage();

  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toIso(new Date()));
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [isEditDetailsOpen, setIsEditDetailsOpen] = useState(false);
  const [isAddResponsibilityOpen, setIsAddResponsibilityOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [editingAssigneesFor, setEditingAssigneesFor] = useState<string | null>(
    null,
  );

  const markedDates = useMemo(
    () => new Set(store.events.map((ev) => ev.date)),
    [store.events],
  );

  const eventsForSelectedDate = useMemo(
    () => store.getEventsForDate(selectedDate),
    [store, selectedDate],
  );

  // Keep a valid selection whenever the day or the underlying data changes.
  const effectiveEventId = useMemo(() => {
    if (
      selectedEventId &&
      eventsForSelectedDate.some((ev) => ev.id === selectedEventId)
    ) {
      return selectedEventId;
    }
    return eventsForSelectedDate[0]?.id ?? null;
  }, [selectedEventId, eventsForSelectedDate]);

  const selectedEvent = useMemo(
    () => store.events.find((ev) => ev.id === effectiveEventId),
    [store.events, effectiveEventId],
  );

  const responsibilitiesForSelectedEvent = useMemo(
    () =>
      effectiveEventId
        ? store.getResponsibilitiesForEvent(effectiveEventId)
        : [],
    [store, effectiveEventId],
  );

  const responsibilityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ev of store.events) {
      counts[ev.id] = ev.responsibilities.length;
    }
    return counts;
  }, [store.events]);

  const categoriesById = useMemo(() => {
    const map: Record<string, (typeof store.categories)[number]> = {};
    for (const c of store.categories) map[c.id] = c;
    return map;
  }, [store.categories]);

  // The responsibility being edited, plus the event it lives in (needed to
  // persist assignee changes since responsibilities are embedded in events).
  const editingAssigneesResp = useMemo(() => {
    if (!editingAssigneesFor) return null;
    for (const ev of store.events) {
      const r = ev.responsibilities.find((x) => x.id === editingAssigneesFor);
      if (r) return { eventId: ev.id, responsibility: r };
    }
    return null;
  }, [store.events, editingAssigneesFor]);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedEventId(null);
  };

  const handleCreateEvent = (value: EventFormValue) => {
    const id = store.addEvent(value);
    setSelectedDate(value.date);
    setSelectedEventId(id);
    setIsNewEventOpen(false);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-m3-bg dark:bg-m3-bg">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              Agenda
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Planeie e atribua responsabilidades para cada dia.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewEventOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-[#0284c7] text-white hover:bg-sky-600 shadow-sm transition-colors cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4" />
              Novo Evento
            </button>
          </div>
        </div>

        {/* Body: calendar / events / details */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_280px] gap-5 items-start">
          <div className="space-y-4">
            <MiniCalendar
              visibleMonth={visibleMonth}
              selectedDate={selectedDate}
              markedDates={markedDates}
              onSelectDate={handleSelectDate}
              onChangeMonth={(delta) =>
                setVisibleMonth(
                  (prev) =>
                    new Date(prev.getFullYear(), prev.getMonth() + delta, 1),
                )
              }
              onGoToday={() => {
                const iso = toIso(new Date());
                setVisibleMonth(new Date());
                handleSelectDate(iso);
              }}
            />
            <DayAgendaList
              events={eventsForSelectedDate}
              selectedEventId={effectiveEventId}
              responsibilityCounts={responsibilityCounts}
              onSelectEvent={setSelectedEventId}
            />
          </div>

          <EventDetailPanel
            event={selectedEvent}
            responsibilities={responsibilitiesForSelectedEvent}
            categories={categoriesById}
            onEditEvent={() => setIsEditEventOpen(true)}
            onAddResponsibility={() => setIsAddResponsibilityOpen(true)}
            onEditAssignees={(respId) => setEditingAssigneesFor(respId)}
            onRemoveResponsibility={(respId) => {
              if (selectedEvent) {
                store.removeResponsibility(selectedEvent.id, respId);
              }
            }}
          />

          <DetailsSidebar
            event={selectedEvent}
            onEditDetails={() => setIsEditDetailsOpen(true)}
            onToggleReminder={() => {
              if (!selectedEvent) return;
              store.updateReminder(selectedEvent.id, {
                ...selectedEvent.reminder,
                enabled: !selectedEvent.reminder.enabled,
              });
            }}
            onEditReminder={() => setIsReminderOpen(true)}
          />
        </div>
      </div>

      {/* Create event */}
      <EventFormModal
        isOpen={isNewEventOpen}
        onClose={() => setIsNewEventOpen(false)}
        onSubmit={handleCreateEvent}
        title="Novo Evento"
        submitLabel="Criar Evento"
        initial={{ date: selectedDate }}
      />

      {/* Edit event (title/time/type/duration) */}
      {selectedEvent && (
        <EventFormModal
          isOpen={isEditEventOpen}
          onClose={() => setIsEditEventOpen(false)}
          onSubmit={(value) => {
            store.updateEvent(selectedEvent.id, value);
            setSelectedDate(value.date);
            setIsEditEventOpen(false);
          }}
          onDelete={() => {
            store.deleteEvent(selectedEvent.id);
            setSelectedEventId(null);
            setIsEditEventOpen(false);
          }}
          title="Editar Evento"
          submitLabel="Guardar"
          initial={selectedEvent}
        />
      )}

      {/* Edit details panel (location / notes) reuses the same form */}
      {selectedEvent && (
        <EventFormModal
          isOpen={isEditDetailsOpen}
          onClose={() => setIsEditDetailsOpen(false)}
          onSubmit={(value) => {
            store.updateEvent(selectedEvent.id, value);
            setIsEditDetailsOpen(false);
          }}
          title="Editar Detalhes"
          submitLabel="Guardar"
          initial={selectedEvent}
        />
      )}

      {/* Add responsibility */}
      {selectedEvent && (
        <AddResponsibilityModal
          isOpen={isAddResponsibilityOpen}
          onClose={() => setIsAddResponsibilityOpen(false)}
          categories={store.categories}
          existingCategoryIds={responsibilitiesForSelectedEvent.map(
            (r) => r.categoryId,
          )}
          manualSuggestions={store.manualAssignees}
          onSubmit={(categoryId, assignees) => {
            store.addResponsibility(selectedEvent.id, categoryId, assignees);
            setIsAddResponsibilityOpen(false);
          }}
        />
      )}

      {/* Edit assignees of one responsibility */}
      {editingAssigneesResp && (
        <EditAssigneesModal
          isOpen={!!editingAssigneesFor}
          onClose={() => setEditingAssigneesFor(null)}
          categoryLabel={
            categoriesById[editingAssigneesResp.responsibility.categoryId]
              ?.label ?? ""
          }
          assignees={editingAssigneesResp.responsibility.assignees}
          manualSuggestions={store.manualAssignees}
          onSubmit={(assignees) => {
            store.updateResponsibilityAssignees(
              editingAssigneesResp.eventId,
              editingAssigneesResp.responsibility.id,
              assignees,
            );
            setEditingAssigneesFor(null);
          }}
        />
      )}

      {/* Edit reminder */}
      {selectedEvent && (
        <EditReminderModal
          isOpen={isReminderOpen}
          onClose={() => setIsReminderOpen(false)}
          initialLabel={selectedEvent.reminder.label}
          onSubmit={(label) => {
            store.updateReminder(selectedEvent.id, {
              ...selectedEvent.reminder,
              label,
              enabled: true,
            });
            setIsReminderOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default AgendaPage;
