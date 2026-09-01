/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TranslateFn, TranslationKey, useI18n } from "@/src/i18n";
import { AgendaEvent, Responsibility } from "@/src/pages/agenda/types";
import { ResponsibilityCategory } from "@/src/types";
import { Calendar, Clock, Pencil, Plus } from "lucide-react";
import React from "react";
import { ResponsibilityRow } from "./ResponsibilityRow";

interface EventDetailPanelProps {
  event: AgendaEvent | undefined;
  responsibilities: Responsibility[];
  categories: Record<string, ResponsibilityCategory>;
  onEditEvent: () => void;
  onAddResponsibility: () => void;
  onEditAssignees: (responsibilityId: string) => void;
  onRemoveResponsibility: (responsibilityId: string) => void;
}

const WEEKDAY_KEYS: TranslationKey[] = [
  "agenda.weekdaysFull.sunday",
  "agenda.weekdaysFull.monday",
  "agenda.weekdaysFull.tuesday",
  "agenda.weekdaysFull.wednesday",
  "agenda.weekdaysFull.thursday",
  "agenda.weekdaysFull.friday",
  "agenda.weekdaysFull.saturday",
];
const MONTH_KEYS: TranslationKey[] = [
  "agenda.months.january",
  "agenda.months.february",
  "agenda.months.march",
  "agenda.months.april",
  "agenda.months.may",
  "agenda.months.june",
  "agenda.months.july",
  "agenda.months.august",
  "agenda.months.september",
  "agenda.months.october",
  "agenda.months.november",
  "agenda.months.december",
];

function formatLongDate(iso: string, t: TranslateFn): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return t("agenda.dateLong", {
    weekday: t(WEEKDAY_KEYS[date.getDay()]),
    day: d,
    month: t(MONTH_KEYS[m - 1]),
    year: y,
  });
}

export const EventDetailPanel: React.FC<EventDetailPanelProps> = ({
  event,
  responsibilities,
  categories,
  onEditEvent,
  onAddResponsibility,
  onEditAssignees,
  onRemoveResponsibility,
}) => {
  const { t } = useI18n();

  if (!event) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-m3-border rounded-2xl p-10 shadow-xs flex flex-col items-center justify-center text-center h-full">
        <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
          {t("agenda.selectEventToSeeDetails")}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {t("agenda.pickDayHint")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        <Calendar className="w-3.5 h-3.5" />
        {formatLongDate(event.date, t)}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-m3-border rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 truncate">
            {event.title}
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {event.time}
            </span>
            <span>•</span>
            <span className="text-[#0284c7] bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-md">
              {event.type}
            </span>
            <span>•</span>
            <span>
              {t("agenda.durationLabel", { minutes: event.durationMinutes })}
            </span>
          </div>
        </div>
        <button
          onClick={onEditEvent}
          className="p-2 rounded-xl border border-m3-border text-slate-400 hover:text-[#0284c7] hover:border-sky-300 transition-colors cursor-pointer shrink-0"
          title={t("agenda.editEvent")}
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-m3-border rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
            {t("agenda.responsibilities")}
          </h3>
          <button
            onClick={onAddResponsibility}
            className="flex items-center gap-1.5 text-xs font-bold text-[#0284c7] bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-900/50 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("agenda.addResponsibility")}
          </button>
        </div>

        {responsibilities.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">
            {t("agenda.noResponsibilities")}
          </p>
        ) : (
          <div>
            {responsibilities.map((r) => (
              <ResponsibilityRow
                key={r.id}
                responsibility={r}
                category={categories[r.categoryId]}
                onEditAssignees={() => onEditAssignees(r.id)}
                onRemove={() => onRemoveResponsibility(r.id)}
              />
            ))}
          </div>
        )}

        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4 pt-3 border-t border-m3-border/40">
          {t("agenda.assigneesGetNotified")}
        </p>
      </div>
    </div>
  );
};
