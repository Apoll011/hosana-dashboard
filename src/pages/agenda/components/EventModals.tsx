/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, Modal } from "@/src/components/common";
import { useServices } from "../../../hooks/useServices";
import {
  Calendar,
  Clock,
  Clock3,
  FileText,
  MapPin,
  Tag,
  Trash2,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Assignee, ResponsibilityCategory } from "../types";
import { AssigneeTagInput } from "./AssigneeTagInput";
import { ServiceLinkField } from "./ServiceLinkField";

/* ------------------------------------------------------------------ */
/* Create / edit an event                                             */
/* ------------------------------------------------------------------ */

export interface EventFormValue {
  title: string;
  type: string;
  date: string;
  time: string;
  durationMinutes: number;
  location: string;
  notes: string;
  /** Linked order-of-worship `Service.id` (`@/src/types`), or null. */
  linkedServiceId: string | null;
}

const COMMON_EVENT_TYPES = [
  "Culto Dominical",
  "Culto de Oração",
  "Ensaio de Louvor",
  "Estudo Bíblico",
  "Reunião de Equipa",
  "Evento Especial",
];

const DURATION_PRESETS = [30, 45, 60, 90, 120];

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
    {children}
  </p>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[11px] font-bold text-m3-text/60 uppercase tracking-wider ml-1 mb-1.5">
    {children}
  </label>
);

const fieldInputClass =
  "w-full h-11 pl-10 pr-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#0284c7]";

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: EventFormValue) => void;
  onDelete?: () => void;
  initial?: Partial<EventFormValue>;
  title: string;
  submitLabel: string;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initial,
  title,
  submitLabel,
}) => {
  const { servicesQuery } = useServices();
  const services = servicesQuery.data ?? [];
  const servicesLoading = servicesQuery.isLoading;

  const [form, setForm] = useState<EventFormValue>({
    title: initial?.title ?? "",
    type: initial?.type ?? "Culto Dominical",
    date: initial?.date ?? new Date().toISOString().slice(0, 10),
    time: initial?.time ?? "10:00",
    durationMinutes: initial?.durationMinutes ?? 90,
    location: initial?.location ?? "",
    notes: initial?.notes ?? "",
    linkedServiceId: initial?.linkedServiceId ?? null,
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        title: initial?.title ?? "",
        type: initial?.type ?? "Culto Dominical",
        date: initial?.date ?? new Date().toISOString().slice(0, 10),
        time: initial?.time ?? "10:00",
        durationMinutes: initial?.durationMinutes ?? 90,
        location: initial?.location ?? "",
        notes: initial?.notes ?? "",
        linkedServiceId: initial?.linkedServiceId ?? null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /**
   * Linking a service pulls its info into the event: the date comes from the
   * service's date and the duration from the sum of its elements. The title
   * is only pre-filled when empty (so the user's own title wins).
   */
  const handleSelectService = (serviceId: string | null) => {
    if (!serviceId) {
      setForm((f) => ({ ...f, linkedServiceId: null }));
      return;
    }
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;
    const seconds = (service.elements ?? []).reduce(
      (acc, el) => acc + Math.max(0, Number(el.duration || 0)),
      0,
    );
    setForm((f) => ({
      ...f,
      linkedServiceId: serviceId,
      date: service.date.slice(0, 10) || f.date,
      durationMinutes:
        seconds > 0 ? Math.max(1, Math.round(seconds / 60)) : f.durationMinutes,
      title: f.title.trim() ? f.title : service.name,
    }));
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title.trim()) return;
          onSubmit(form);
        }}
        className="space-y-6 pt-1"
      >
        {/* ── Serviço ligado ─────────────────────────────────────────── */}
        <section className="space-y-2">
          <SectionLabel>Serviço ligado</SectionLabel>
          <ServiceLinkField
            services={services}
            isLoading={servicesLoading}
            value={form.linkedServiceId}
            onChange={handleSelectService}
          />
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            Ligar um serviço preenche automaticamente a data e a duração do
            evento.
          </p>
        </section>

        {/* ── Informações ────────────────────────────────────────────── */}
        <section className="space-y-2">
          <SectionLabel>Informações</SectionLabel>
          <Input
            label="Título"
            placeholder="Ex: Culto da Manhã"
            icon={<FileText className="w-4 h-4" />}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <div>
            <FieldLabel>Tipo</FieldLabel>
            <div className="relative">
              <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                list="agenda-event-types"
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value }))
                }
                placeholder="Ex: Culto Dominical, Ensaio…"
                className={fieldInputClass}
              />
            </div>
            <datalist id="agenda-event-types">
              {COMMON_EVENT_TYPES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
        </section>

        {/* ── Agendamento ────────────────────────────────────────────── */}
        <section className="space-y-2">
          <SectionLabel>Agendamento</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="Data"
              icon={<Calendar className="w-4 h-4" />}
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
            <Input
              type="time"
              label="Hora"
              icon={<Clock className="w-4 h-4" />}
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              required
            />
          </div>
          <div>
            <FieldLabel>Duração</FieldLabel>
            <div className="flex gap-1.5 flex-wrap">
              {DURATION_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, durationMinutes: m }))
                  }
                  className={`px-3 h-8 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                    form.durationMinutes === m
                      ? "bg-[#0284c7] text-white border-[#0284c7]"
                      : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#0284c7]/40"
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
            <div className="mt-2 relative">
              <Clock3 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="number"
                min={0}
                step={5}
                value={String(form.durationMinutes)}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    durationMinutes: Number(e.target.value) || 0,
                  }))
                }
                className={fieldInputClass}
              />
            </div>
          </div>
        </section>

        {/* ── Detalhes ───────────────────────────────────────────────── */}
        <section className="space-y-2">
          <SectionLabel>Detalhes</SectionLabel>
          <Input
            label="Local"
            placeholder="Ex: Templo Principal"
            icon={<MapPin className="w-4 h-4" />}
            value={form.location}
            onChange={(e) =>
              setForm((f) => ({ ...f, location: e.target.value }))
            }
          />
          <div>
            <FieldLabel>Observações</FieldLabel>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Notas de planeamento…"
              className="w-full h-20 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0284c7] resize-none"
            />
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 pt-4 border-t border-m3-border/40">
          {onDelete ? (
            <Button
              variant="outline"
              type="button"
              onClick={onDelete}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Eliminar
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={!form.title.trim()}>
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Add a responsibility (pick category + assignees) to an event       */
/* ------------------------------------------------------------------ */

interface AddResponsibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ResponsibilityCategory[];
  existingCategoryIds: string[];
  manualSuggestions?: Assignee[];
  onSubmit: (categoryId: string, assignees: Assignee[]) => void;
}

export const AddResponsibilityModal: React.FC<AddResponsibilityModalProps> = ({
  isOpen,
  onClose,
  categories,
  existingCategoryIds,
  manualSuggestions,
  onSubmit,
}) => {
  const available = categories.filter((c) => !existingCategoryIds.includes(c.id));
  const [categoryId, setCategoryId] = useState(available[0]?.id ?? "");
  const [assignees, setAssignees] = useState<Assignee[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCategoryId(available[0]?.id ?? "");
      setAssignees([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Responsabilidade">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!categoryId) return;
          onSubmit(categoryId, assignees);
        }}
        className="space-y-4 pt-2"
      >
        {available.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Todas as responsabilidades disponíveis já foram adicionadas a este
            evento. Pode criar novas responsabilidades em Definições &gt;
            Servidor.
          </p>
        ) : (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Categoria
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold"
              >
                {available.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Atribuir a
              </label>
              <AssigneeTagInput
                assignees={assignees}
                onChange={setAssignees}
                manualSuggestions={manualSuggestions}
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={available.length === 0}>
            Adicionar
          </Button>
        </div>
      </form>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Edit the assignees of an existing responsibility                   */
/* ------------------------------------------------------------------ */

interface EditAssigneesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryLabel: string;
  assignees: Assignee[];
  manualSuggestions?: Assignee[];
  onSubmit: (assignees: Assignee[]) => void;
}

export const EditAssigneesModal: React.FC<EditAssigneesModalProps> = ({
  isOpen,
  onClose,
  categoryLabel,
  assignees,
  manualSuggestions,
  onSubmit,
}) => {
  const [value, setValue] = useState<Assignee[]>(assignees);

  useEffect(() => {
    if (isOpen) setValue(assignees);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Atribuídos — ${categoryLabel}`}>
      <div className="space-y-4 pt-2">
        <AssigneeTagInput
          assignees={value}
          onChange={setValue}
          manualSuggestions={manualSuggestions}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="button" onClick={() => onSubmit(value)}>
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Edit the reminder for an event                                     */
/* ------------------------------------------------------------------ */

interface EditReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLabel: string;
  onSubmit: (label: string) => void;
}

export const EditReminderModal: React.FC<EditReminderModalProps> = ({
  isOpen,
  onClose,
  initialLabel,
  onSubmit,
}) => {
  const [label, setLabel] = useState(initialLabel);

  useEffect(() => {
    if (isOpen) setLabel(initialLabel);
  }, [isOpen, initialLabel]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Lembrete">
      <div className="space-y-4 pt-2">
        <Input
          label="Quando notificar"
          placeholder="Ex: 2 dias antes às 18:00"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="button" onClick={() => onSubmit(label)}>
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
