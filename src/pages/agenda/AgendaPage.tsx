/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CalendarPlus, Settings2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { DayAgendaList } from "./components/DayAgendaList";
import { DetailsSidebar } from "./components/DetailsSidebar";
import { MiniCalendar, toIso } from "./components/MiniCalendar";
import { ServiceDetailPanel } from "./components/ServiceDetailPanel";
import {
  AddResponsibilityModal,
  EditAssigneesModal,
  EditReminderModal,
  ManageCategoriesModal,
  ServiceFormModal,
  ServiceFormValue,
} from "./components/ServiceModals";
import { useAgendaStorage } from "./useAgendaStorage";

export const AgendaPage: React.FC = () => {
  const store = useAgendaStorage();

  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toIso(new Date()));
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );

  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);
  const [isEditDetailsOpen, setIsEditDetailsOpen] = useState(false);
  const [isAddResponsibilityOpen, setIsAddResponsibilityOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [editingAssigneesFor, setEditingAssigneesFor] = useState<string | null>(
    null,
  );

  const markedDates = useMemo(
    () => new Set(store.services.map((s) => s.date)),
    [store.services],
  );

  const servicesForSelectedDate = useMemo(
    () => store.getServicesForDate(selectedDate),
    [store, selectedDate],
  );

  // Keep a valid selection whenever the day or the underlying data changes.
  const effectiveServiceId = useMemo(() => {
    if (
      selectedServiceId &&
      servicesForSelectedDate.some((s) => s.id === selectedServiceId)
    ) {
      return selectedServiceId;
    }
    return servicesForSelectedDate[0]?.id ?? null;
  }, [selectedServiceId, servicesForSelectedDate]);

  const selectedService = useMemo(
    () => store.services.find((s) => s.id === effectiveServiceId),
    [store.services, effectiveServiceId],
  );

  const responsibilitiesForSelectedService = useMemo(
    () =>
      effectiveServiceId
        ? store.getResponsibilitiesForService(effectiveServiceId)
        : [],
    [store, effectiveServiceId],
  );

  const responsibilityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of store.responsibilities) {
      counts[r.serviceId] = (counts[r.serviceId] ?? 0) + 1;
    }
    return counts;
  }, [store.responsibilities]);

  const categoriesById = useMemo(() => {
    const map: Record<string, (typeof store.categories)[number]> = {};
    for (const c of store.categories) map[c.id] = c;
    return map;
  }, [store.categories]);

  const editingAssigneesResp = useMemo(
    () => store.responsibilities.find((r) => r.id === editingAssigneesFor),
    [store.responsibilities, editingAssigneesFor],
  );

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedServiceId(null);
  };

  const handleCreateService = (value: ServiceFormValue) => {
    const id = store.addService(value);
    setSelectedDate(value.date);
    setSelectedServiceId(id);
    setIsNewServiceOpen(false);
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
              onClick={() => setIsManageCategoriesOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-m3-border text-slate-600 dark:text-slate-300 hover:bg-m3-hover transition-colors cursor-pointer"
            >
              <Settings2 className="w-4 h-4" />
              Responsabilidades
            </button>
            <button
              onClick={() => setIsNewServiceOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-[#0284c7] text-white hover:bg-sky-600 shadow-sm transition-colors cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4" />
              Nova Agenda
            </button>
          </div>
        </div>

        {/* Body: calendar / responsibilities / details */}
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
              services={servicesForSelectedDate}
              selectedServiceId={effectiveServiceId}
              responsibilityCounts={responsibilityCounts}
              onSelectService={setSelectedServiceId}
            />
          </div>

          <ServiceDetailPanel
            service={selectedService}
            responsibilities={responsibilitiesForSelectedService}
            categories={categoriesById}
            onEditService={() => setIsEditServiceOpen(true)}
            onAddResponsibility={() => setIsAddResponsibilityOpen(true)}
            onEditAssignees={(respId) => setEditingAssigneesFor(respId)}
            onRemoveResponsibility={(respId) =>
              store.removeResponsibility(respId)
            }
          />

          <DetailsSidebar
            service={selectedService}
            onEditDetails={() => setIsEditDetailsOpen(true)}
            onToggleReminder={() => {
              if (!selectedService) return;
              store.updateReminder(selectedService.id, {
                ...selectedService.reminder,
                enabled: !selectedService.reminder.enabled,
              });
            }}
            onEditReminder={() => setIsReminderOpen(true)}
          />
        </div>
      </div>

      {/* Create service */}
      <ServiceFormModal
        isOpen={isNewServiceOpen}
        onClose={() => setIsNewServiceOpen(false)}
        onSubmit={handleCreateService}
        title="Nova Agenda"
        submitLabel="Criar Agenda"
        initial={{ date: selectedDate }}
      />

      {/* Edit service (title/time/type/duration) */}
      {selectedService && (
        <ServiceFormModal
          isOpen={isEditServiceOpen}
          onClose={() => setIsEditServiceOpen(false)}
          onSubmit={(value) => {
            store.updateService(selectedService.id, value);
            setSelectedDate(value.date);
            setIsEditServiceOpen(false);
          }}
          onDelete={() => {
            store.deleteService(selectedService.id);
            setSelectedServiceId(null);
            setIsEditServiceOpen(false);
          }}
          title="Editar Agenda"
          submitLabel="Guardar"
          initial={selectedService}
        />
      )}

      {/* Edit details panel (location / notes) reuses the same form */}
      {selectedService && (
        <ServiceFormModal
          isOpen={isEditDetailsOpen}
          onClose={() => setIsEditDetailsOpen(false)}
          onSubmit={(value) => {
            store.updateService(selectedService.id, value);
            setIsEditDetailsOpen(false);
          }}
          title="Editar Detalhes"
          submitLabel="Guardar"
          initial={selectedService}
        />
      )}

      {/* Add responsibility */}
      {selectedService && (
        <AddResponsibilityModal
          isOpen={isAddResponsibilityOpen}
          onClose={() => setIsAddResponsibilityOpen(false)}
          categories={store.categories}
          existingCategoryIds={responsibilitiesForSelectedService.map(
            (r) => r.categoryId,
          )}
          onSubmit={(categoryId, assignees) => {
            store.addResponsibility(selectedService.id, categoryId, assignees);
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
            categoriesById[editingAssigneesResp.categoryId]?.label ?? ""
          }
          assignees={editingAssigneesResp.assignees}
          onSubmit={(assignees) => {
            store.updateResponsibilityAssignees(
              editingAssigneesResp.id,
              assignees,
            );
            setEditingAssigneesFor(null);
          }}
        />
      )}

      {/* Manage master category list */}
      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        categories={store.categories}
        onAdd={(cat) => store.addCategory(cat)}
        onRemove={(id) => store.removeCategory(id)}
      />

      {/* Edit reminder */}
      {selectedService && (
        <EditReminderModal
          isOpen={isReminderOpen}
          onClose={() => setIsReminderOpen(false)}
          initialLabel={selectedService.reminder.label}
          onSubmit={(label) => {
            store.updateReminder(selectedService.id, {
              ...selectedService.reminder,
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
