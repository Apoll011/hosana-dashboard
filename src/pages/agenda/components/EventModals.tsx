/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, Modal } from "@/src/components/common";
import {
  BellRing,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Clock3,
  FileText,
  Inbox,
  Info,
  Layers,
  ListChecks,
  MapPin,
  Minus,
  Plus,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useServices } from "../../../hooks/useServices";
import { Assignee, ResponsibilityCategory } from "../types";
import { AssigneeTagInput } from "./AssigneeTagInput";
import { ServiceLinkField } from "./ServiceLinkField";

/* ------------------------------------------------------------------ */
/* Shared bits                                                        */
/* ------------------------------------------------------------------ */

const ACCENT = "#0284c7";

/** Section header with an icon "badge", a title and an optional hint. */
const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  hint?: string;
}> = ({ icon, title, hint }) => (
  <div className="flex items-start gap-2.5">
    <div className="mt-0.5 w-6 h-6 shrink-0 rounded-lg bg-[#0284c7]/10 text-[#0284c7] flex items-center justify-center">
      {icon}
    </div>
    <div>
      <p className="text-[13px] font-bold text-m3-text/80 leading-tight">
        {title}
      </p>
      {hint && (
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
          {hint}
        </p>
      )}
    </div>
  </div>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[11px] font-bold text-m3-text/60 uppercase tracking-wider ml-1 mb-1.5">
    {children}
  </label>
);

const fieldInputClass =
  "w-full h-11 pl-10 pr-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#0284c7] transition-colors";

/** Small icon-only round button, used for steppers and dismiss actions. */
const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "danger";
  }
> = ({ className = "", variant = "default", ...props }) => (
  <button
    type="button"
    className={`w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
      variant === "danger"
        ? "border-red-200 dark:border-red-900/60 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
        : "border-slate-200 dark:border-slate-800 text-slate-500 hover:border-[#0284c7]/50 hover:text-[#0284c7]"
    } ${className}`}
    {...props}
  />
);

const formatDuration = (minutes: number) => {
  if (minutes <= 0) return "0 min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
};

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
const NOTES_MAX = 500;

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: EventFormValue) => void;
  onDelete?: () => void;
  initial?: Partial<EventFormValue>;
  title: string;
  submitLabel: string;
}

const emptyEventForm = (initial?: Partial<EventFormValue>): EventFormValue => ({
  title: initial?.title ?? "",
  type: initial?.type ?? "Culto Dominical",
  date: initial?.date ?? new Date().toISOString().slice(0, 10),
  time: initial?.time ?? "10:00",
  durationMinutes: initial?.durationMinutes ?? 90,
  location: initial?.location ?? "",
  notes: initial?.notes ?? "",
  linkedServiceId: initial?.linkedServiceId ?? null,
});

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

  const [form, setForm] = useState<EventFormValue>(() =>
    emptyEventForm(initial),
  );
  const [titleTouched, setTitleTouched] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(emptyEventForm(initial));
      setTitleTouched(false);
      setConfirmingDelete(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const titleIsEmpty = form.title.trim().length === 0;
  const showTitleError = titleTouched && titleIsEmpty;

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

  const adjustDuration = (delta: number) =>
    setForm((f) => ({
      ...f,
      durationMinutes: Math.max(0, f.durationMinutes + delta),
    }));

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTitleTouched(true);
          if (titleIsEmpty) return;
          onSubmit(form);
        }}
        className="space-y-7 pt-1"
      >
        {/* ── Serviço ligado ─────────────────────────────────────────── */}
        <section className="space-y-2.5">
          <SectionHeader
            icon={<Layers className="w-3.5 h-3.5" />}
            title="Serviço ligado"
            hint="Preenche automaticamente a data e a duração do evento."
          />
          <ServiceLinkField
            services={services}
            isLoading={servicesLoading}
            value={form.linkedServiceId}
            onChange={handleSelectService}
          />
        </section>

        {/* ── Informações ────────────────────────────────────────────── */}
        <section className="space-y-2.5">
          <SectionHeader
            icon={<FileText className="w-3.5 h-3.5" />}
            title="Informações"
          />
          <div>
            <Input
              label="Título"
              placeholder="Ex: Culto da Manhã"
              icon={<FileText className="w-4 h-4" />}
              value={form.title}
              onChange={(e) => {
                setForm((f) => ({ ...f, title: e.target.value }));
                if (titleTouched) setTitleTouched(false);
              }}
              onBlur={() => setTitleTouched(true)}
              required
            />
            {showTitleError && (
              <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500 mt-1.5 ml-1">
                <Info className="w-3 h-3" /> O título é obrigatório.
              </p>
            )}
          </div>
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
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_EVENT_TYPES.filter((t) => t !== form.type).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className="px-2.5 h-7 rounded-full text-[11px] font-semibold border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-[#0284c7]/50 hover:text-[#0284c7] transition-colors cursor-pointer"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Agendamento ────────────────────────────────────────────── */}
        <section className="space-y-2.5">
          <SectionHeader
            icon={<Calendar className="w-3.5 h-3.5" />}
            title="Agendamento"
          />
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
            <div className="flex gap-1.5 flex-wrap mb-2">
              {DURATION_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, durationMinutes: m }))}
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
            <div className="flex items-center gap-2">
              <IconButton
                aria-label="Diminuir duração"
                onClick={() => adjustDuration(-15)}
                disabled={form.durationMinutes <= 0}
              >
                <Minus className="w-4 h-4" />
              </IconButton>
              <div className="flex-1 h-11 flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <Clock3 className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold tabular-nums">
                  {formatDuration(form.durationMinutes)}
                </span>
              </div>
              <IconButton
                aria-label="Aumentar duração"
                onClick={() => adjustDuration(15)}
              >
                <Plus className="w-4 h-4" />
              </IconButton>
            </div>
          </div>
        </section>

        {/* ── Detalhes ───────────────────────────────────────────────── */}
        <section className="space-y-2.5">
          <SectionHeader
            icon={<MapPin className="w-3.5 h-3.5" />}
            title="Detalhes"
          />
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
            <div className="flex items-center justify-between ml-1 mb-1.5">
              <FieldLabel>
                <span className="ml-0">Observações</span>
              </FieldLabel>
              <span
                className={`text-[10px] font-bold tabular-nums ${
                  form.notes.length > NOTES_MAX
                    ? "text-red-500"
                    : "text-slate-300 dark:text-slate-600"
                }`}
              >
                {form.notes.length}/{NOTES_MAX}
              </span>
            </div>
            <textarea
              value={form.notes}
              maxLength={NOTES_MAX}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Notas de planeamento…"
              className="w-full h-20 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0284c7] transition-colors resize-none"
            />
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 pt-4 border-t border-m3-border/40">
          {onDelete ? (
            confirmingDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-red-500 hidden sm:inline">
                  Eliminar este evento?
                </span>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                >
                  Cancelar
                </Button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="h-10 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Confirmar
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                type="button"
                onClick={() => setConfirmingDelete(true)}
                icon={<Trash2 className="w-4 h-4" />}
              >
                Eliminar
              </Button>
            )
          ) : (
            <span />
          )}
          {!confirmingDelete && (
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit">
                {submitLabel}
              </Button>
            </div>
          )}
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
  const available = useMemo(
    () => categories.filter((c) => !existingCategoryIds.includes(c.id)),
    [categories, existingCategoryIds],
  );
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
        className="space-y-5 pt-2"
      >
        {available.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-2.5 py-8">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              Já foram adicionadas todas as responsabilidades
            </p>
            <p className="text-xs font-medium text-slate-400 max-w-[240px] leading-relaxed">
              Pode criar novas categorias em Definições → Servidor.
            </p>
          </div>
        ) : (
          <>
            <section className="space-y-2.5">
              <SectionHeader
                icon={<ListChecks className="w-3.5 h-3.5" />}
                title="Categoria"
                hint="Escolha a área de serviço a atribuir."
              />
              <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
                {available.map((c) => {
                  const selected = c.id === categoryId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className={`flex items-center justify-between gap-3 px-3.5 h-11 rounded-xl border text-sm font-bold transition-colors cursor-pointer ${
                        selected
                          ? "border-[#0284c7] bg-[#0284c7]/[0.06] text-[#0284c7]"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#0284c7]/40"
                      }`}
                    >
                      <span>{c.label}</span>
                      {selected ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 shrink-0 text-slate-200 dark:text-slate-700" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-2.5">
              <SectionHeader
                icon={<Users className="w-3.5 h-3.5" />}
                title="Atribuir a"
                hint={
                  assignees.length > 0
                    ? `${assignees.length} pessoa${assignees.length > 1 ? "s" : ""} selecionada${
                        assignees.length > 1 ? "s" : ""
                      }`
                    : "Opcional — pode atribuir mais tarde."
                }
              />
              <AssigneeTagInput
                assignees={assignees}
                onChange={setAssignees}
                manualSuggestions={manualSuggestions}
              />
            </section>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-m3-border/40 mt-1">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={available.length === 0}
          >
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Atribuídos — ${categoryLabel}`}
    >
      <div className="space-y-5 pt-2">
        <SectionHeader
          icon={<Users className="w-3.5 h-3.5" />}
          title={categoryLabel}
          hint={
            value.length > 0
              ? `${value.length} pessoa${value.length > 1 ? "s" : ""} atribuída${
                  value.length > 1 ? "s" : ""
                }`
              : "Ainda sem ninguém atribuído."
          }
        />
        <AssigneeTagInput
          assignees={value}
          onChange={setValue}
          manualSuggestions={manualSuggestions}
        />
        <div className="flex justify-end gap-2 pt-2 border-t border-m3-border/40">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={() => onSubmit(value)}
          >
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

const REMINDER_PRESETS = [
  "No dia do evento",
  "1 hora antes",
  "3 horas antes",
  "1 dia antes",
  "2 dias antes",
  "1 semana antes",
];

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

  const trimmed = label.trim();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Lembrete">
      <div className="space-y-5 pt-2">
        <section className="space-y-2.5">
          <SectionHeader
            icon={<BellRing className="w-3.5 h-3.5" />}
            title="Quando notificar"
            hint="Escolha uma sugestão ou escreva a sua própria."
          />
          <div className="flex flex-wrap gap-1.5">
            {REMINDER_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setLabel(p)}
                className={`px-3 h-8 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                  label === p
                    ? "bg-[#0284c7] text-white border-[#0284c7]"
                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#0284c7]/40"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="relative">
            <BellRing className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: 2 dias antes às 18:00"
              maxLength={80}
              className={`${fieldInputClass} pr-9`}
            />
            {label.length > 0 && (
              <button
                type="button"
                aria-label="Limpar lembrete"
                onClick={() => setLabel("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </section>

        {/* ── Preview ────────────────────────────────────────────────── */}
        <div
          className={`flex items-center gap-2.5 px-3.5 h-11 rounded-xl border text-sm font-semibold ${
            trimmed
              ? "border-[#0284c7]/30 bg-[#0284c7]/[0.06] text-[#0284c7]"
              : "border-dashed border-slate-200 dark:border-slate-800 text-slate-400"
          }`}
        >
          <BellRing className="w-4 h-4 shrink-0" />
          <span className="truncate">{trimmed || "Sem lembrete definido"}</span>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-m3-border/40">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={() => onSubmit(label)}
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
