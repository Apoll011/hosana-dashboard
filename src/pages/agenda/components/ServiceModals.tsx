/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, Modal } from "@/src/components/common";
import { Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { COLOR_MAP, ICON_MAP } from "../iconMap";
import {
  Assignee,
  ResponsibilityCategory,
  ResponsibilityColor,
  ResponsibilityIconKey,
  AgendaService,
} from "../types";
import { AssigneeTagInput } from "./AssigneeTagInput";

/* ------------------------------------------------------------------ */
/* Create / edit a service                                            */
/* ------------------------------------------------------------------ */

export interface ServiceFormValue {
  title: string;
  type: string;
  date: string;
  time: string;
  durationMinutes: number;
  location: string;
  notes: string;
}

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: ServiceFormValue) => void;
  onDelete?: () => void;
  initial?: Partial<ServiceFormValue>;
  title: string;
  submitLabel: string;
}

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initial,
  title,
  submitLabel,
}) => {
  const [form, setForm] = useState<ServiceFormValue>({
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
/* Add a responsibility (pick category + assignees) to a service      */
/* ------------------------------------------------------------------ */

interface AddResponsibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ResponsibilityCategory[];
  existingCategoryIds: string[];
  onSubmit: (categoryId: string, assignees: Assignee[]) => void;
}

export const AddResponsibilityModal: React.FC<AddResponsibilityModalProps> = ({
  isOpen,
  onClose,
  categories,
  existingCategoryIds,
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
            Todas as responsabilidades disponíveis já foram adicionadas a esta
            agenda. Pode criar novas categorias em &quot;Responsabilidades&quot;.
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
              <AssigneeTagInput assignees={assignees} onChange={setAssignees} />
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
  onSubmit: (assignees: Assignee[]) => void;
}

export const EditAssigneesModal: React.FC<EditAssigneesModalProps> = ({
  isOpen,
  onClose,
  categoryLabel,
  assignees,
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
        <AssigneeTagInput assignees={value} onChange={setValue} />
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
/* Manage the master list of responsibility categories                */
/* ------------------------------------------------------------------ */

const ICON_OPTIONS: ResponsibilityIconKey[] = [
  "mic", "music", "volume", "light", "monitor", "book", "heart", "users", "camera",
];
const COLOR_OPTIONS: ResponsibilityColor[] = [
  "amber", "violet", "sky", "rose", "emerald", "cyan", "indigo", "slate",
];

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ResponsibilityCategory[];
  onAdd: (category: Omit<ResponsibilityCategory, "id">) => void;
  onRemove: (id: string) => void;
}

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAdd,
  onRemove,
}) => {
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState<ResponsibilityIconKey>("mic");
  const [color, setColor] = useState<ResponsibilityColor>("sky");

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerir Responsabilidades">
      <div className="space-y-5 pt-2">
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {categories.map((c) => {
            const Icon = ICON_MAP[c.icon];
            const colors = COLOR_MAP[c.color];
            return (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 p-2 rounded-xl border border-m3-border/60"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colors.bg} ${colors.text}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {c.label}
                  </span>
                </div>
                <button
                  onClick={() => onRemove(c.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Remover categoria"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
          {categories.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">
              Nenhuma responsabilidade criada ainda.
            </p>
          )}
        </div>

        <div className="border-t border-m3-border/60 pt-4 space-y-3">
          <p className="text-xs font-black text-slate-700 dark:text-slate-300">
            Nova responsabilidade
          </p>
          <Input
            label="Nome"
            placeholder="Ex: Vídeo, Transmissão..."
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ícone
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ICON_OPTIONS.map((opt) => {
                  const Icon = ICON_MAP[opt];
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setIcon(opt)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors cursor-pointer ${
                        icon === opt
                          ? "border-[#0284c7] bg-sky-50 dark:bg-sky-950/40 text-[#0284c7]"
                          : "border-m3-border text-slate-400 hover:bg-m3-hover"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cor
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map((opt) => {
                  const colors = COLOR_MAP[opt];
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setColor(opt)}
                      className={`w-8 h-8 rounded-lg border-2 transition-colors cursor-pointer ${colors.bg} ${
                        color === opt ? "border-slate-900 dark:border-white" : "border-transparent"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              type="button"
              disabled={!label.trim()}
              onClick={() => {
                if (!label.trim()) return;
                onAdd({ label: label.trim(), icon, color });
                setLabel("");
              }}
            >
              Adicionar
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-m3-border/60">
          <Button variant="outline" type="button" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Edit the reminder for a service                                    */
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
