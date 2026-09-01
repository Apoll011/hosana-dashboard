/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useI18n } from "@/src/lib/i18n";
import { AgendaEvent, Responsibility } from "@/src/pages/agenda/types";
import { ResponsibilityCategory } from "@/src/types";
import { Calendar, Plus } from "lucide-react";
import React from "react";
import { ResponsibilityRow } from "./ResponsibilityRow";

interface ResponsibilitiesPanelProps {
  event: AgendaEvent | undefined;
  responsibilities: Responsibility[];
  categories: Record<string, ResponsibilityCategory>;
  onAddResponsibility: () => void;
  onEditAssignees: (responsibilityId: string) => void;
  onRemoveResponsibility: (responsibilityId: string) => void;
}

export const ResponsibilitiesPanel: React.FC<ResponsibilitiesPanelProps> = ({
  event,
  responsibilities,
  categories,
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
