/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, Modal } from "@/src/components/common";
import { Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Assignee, ResponsibilityCategory } from "../types";
import { AssigneeTagInput } from "./AssigneeTagInput";

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
}

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
  const [form, setForm] = useState<EventFormValue>({
    title: initial?.title ?? "",
    type: initial?.type ?? "Culto Dominical",
    date: initial?.date ?? new Date().toISOString().slice(0, 10),
    time: initial?.time ?? "10:00",
    durationMinutes: initial?.durationMinutes ?? 90,
    location: initial?.location ?? "",
    notes: initial?.notes ?? "",
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
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title.trim()) return;
          onSubmit(form);
        }}
        className="space-y-4 pt-2"
      >
        <Input
          label="Título"
          placeholder="Ex: Culto da Manhã"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Tipo
          </label>
          <input
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            placeholder="Ex: Culto Dominical, Ensaio..."
            className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#0284c7]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            label="Data"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required
          />
          <Input
            type="time"
            label="Hora"
            value={form.time}
            onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            required
          />
        </div>

        <Input
          type="number"
          label="Duração (minutos)"
          value={String(form.durationMinutes)}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              durationMinutes: Number(e.target.value) || 0,
            }))
          }
        />

        <Input
          label="Local"
          placeholder="Ex: Templo Principal"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
        />

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Observações
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="w-full h-20 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0284c7] resize-none"
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
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
