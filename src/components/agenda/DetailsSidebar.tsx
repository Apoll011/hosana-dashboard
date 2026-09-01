/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAuth } from "@/src/contexts/AuthContext";
import { useAppNavigate } from "@/src/hooks/useAppNavigate";
import { useServices } from "@/src/hooks/useServices";
import { TranslateFn, TranslationKey, useI18n } from "@/src/lib/i18n";
import { AgendaEvent } from "@/src/pages/agenda/types";
import { Bell, ExternalLink, Link2, Pencil } from "lucide-react";
import React from "react";
import { serviceTotalMinutes } from "./ServiceLinkField";

interface DetailsSidebarProps {
  event: AgendaEvent | undefined;
  onEdit: () => void;
  onToggleReminder: () => void;
  onEditReminder: () => void;
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

function formatShortDate(iso: string, t: TranslateFn): string {
  const [y, m, d] = (iso || "").split("T")[0].split("-").map(Number);
  if (!y || !m || !d) return iso || "";
  return t("agenda.dateShort", {
    day: String(d).padStart(2, "0"),
    month: String(m).padStart(2, "0"),
    year: y,
  });
}

export const DetailsSidebar: React.FC<DetailsSidebarProps> = ({
  event,
  onEdit,
  onToggleReminder,
  onEditReminder,
}) => {
  const { servicesQuery } = useServices();
  const { organization } = useAuth();
  const { navigate } = useAppNavigate();
  const { t } = useI18n();
  const slugPrefix = organization?.slug ? `/${organization.slug}` : "";

  const linkedService = event?.linkedServiceId
    ? ((servicesQuery.data ?? []).find((s) => s.id === event.linkedServiceId) ??
      null)
    : null;

  if (!event) return null;

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-m3-border rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-m3-secondary opacity-70">
            {t("common.details")}
          </h3>
          <button
            onClick={onEdit}
            className="p-1 rounded-lg text-slate-400 hover:text-[#0284c7] hover:bg-m3-hover transition-colors cursor-pointer"
            title={t("agenda.editEvent")}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              {t("common.name")}
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
              {event.title}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              {t("common.date")}
            </p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {formatLongDate(event.date, t)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                {t("agenda.time")}
              </p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {event.time}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                {t("agenda.duration")}
              </p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {t("agenda.minutes", { minutes: event.durationMinutes })}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              {t("agenda.type")}
            </p>
            <p className="text-sm font-bold text-[#0284c7] mt-0.5">
              {event.type}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              {t("agenda.linkedService")}
            </p>
            {linkedService ? (
              <div className="mt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5 min-w-0">
                    <Link2 className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                    <span className="truncate">{linkedService.name}</span>
                  </span>
                  <button
                    onClick={() =>
                      navigate(`${slugPrefix}/services/${linkedService.id}`)
                    }
                    title={t("agenda.openService")}
                    className="p-1 rounded-lg text-slate-400 hover:text-[#0284c7] hover:bg-m3-hover transition-colors cursor-pointer shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                  {formatShortDate(linkedService.date, t)} ·{" "}
                  {t("agenda.minutes", {
                    minutes: serviceTotalMinutes(linkedService),
                  })}
                </p>
              </div>
            ) : (
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                —
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              {t("agenda.location")}
            </p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {event.location || "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              {t("agenda.notes")}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
              {event.notes || t("agenda.noNotes")}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-m3-border rounded-2xl p-5 shadow-xs">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-m3-secondary opacity-70 mb-3 flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5" />
          {t("agenda.notifications")}
        </h3>

        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {t("agenda.reminderForAssignees")}
            </p>
            <button
              onClick={onEditReminder}
              className="text-xs font-bold text-[#0284c7] hover:underline cursor-pointer mt-0.5"
            >
              {event.reminder.label}
            </button>
          </div>
          <button
            onClick={onToggleReminder}
            role="switch"
            aria-checked={event.reminder.enabled}
            className={`w-10 h-6 rounded-full relative shrink-0 transition-colors cursor-pointer ${
              event.reminder.enabled
                ? "bg-[#0284c7]"
                : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                event.reminder.enabled ? "-translate-x-0.5" : "-translate-x-4.5"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
