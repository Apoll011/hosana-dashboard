/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgendaEvent, ResponsibilityCategory } from "@/src/types";
import { useI18n } from "@/src/lib/i18n";
import React, { useMemo } from "react";
import { PrintOptions } from "../types";
import { TemplateFooter } from "./TemplateFooter";
import { TemplateHeader } from "./TemplateHeader";

interface EventPrintViewProps {
  event: AgendaEvent;
  categories?: ResponsibilityCategory[];
  options: PrintOptions;
  churchName?: string;
  churchLogo?: string | null;
  churchShortName?: string;
  accentColor?: string;
}

export const EventPrintView: React.FC<EventPrintViewProps> = ({
  event,
  categories = [],
  options,
  churchName,
  churchLogo,
  churchShortName,
  accentColor,
}) => {
  const { t } = useI18n();
  const { templateFamily } = options;

  // Category lookup map
  const categoryMap = useMemo(() => {
    const map = new Map<string, ResponsibilityCategory>();
    for (const cat of categories) {
      map.set(cat.id, cat);
    }
    return map;
  }, [categories]);

  // Formatted date
  const formattedDate = useMemo(() => {
    if (!event.date) return "";
    try {
      const d = new Date(event.date);
      return d.toLocaleDateString("pt-PT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return event.date;
    }
  }, [event.date]);

  return (
    <div
      className={`print-sheet print:break-inside-auto print:page-break-after-always bg-white text-slate-900 print:text-black p-6 sm:p-8 max-w-4xl mx-auto ${
        templateFamily === "classic"
          ? "font-serif"
          : templateFamily === "contemporary"
            ? "font-sans"
            : templateFamily === "compact"
              ? "p-4 sm:p-5"
              : "font-sans"
      }`}
    >
      <div>
        <TemplateHeader
          churchName={churchName}
          churchLogo={churchLogo}
          churchShortName={churchShortName}
          accentColor={accentColor}
          title={event.title}
          subtitle={`${formattedDate} • ${event.time} (${event.durationMinutes || 60} min)`}
          metaBadge={t("print.event.badge")}
          options={options}
        />

        {/* DETAILS HIGHLIGHT BAR */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl mb-6 text-xs ${
            templateFamily === "classic"
              ? "border border-slate-300 bg-slate-50 font-serif"
              : templateFamily === "contemporary"
                ? "border-2 border-slate-950 bg-slate-100 font-mono"
                : "border border-slate-200 bg-slate-50"
          }`}
        >
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-0.5">
              {t("print.event.time")}
            </span>
            <span className="font-semibold text-slate-900">
              {event.time} ({event.durationMinutes} min)
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-0.5">
              {t("print.event.location")}
            </span>
            <span className="font-semibold text-slate-900">
              {event.location || t("print.event.defaultLocation")}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-0.5">
              {t("print.event.eventType")}
            </span>
            <span className="font-semibold text-slate-900 capitalize">
              {event.type || t("print.event.defaultType")}
            </span>
          </div>
        </div>

        {/* RESPONSIBILITIES / ROSTER TABLE */}
        <div className="my-5">
          <h2
            className={`text-sm font-bold uppercase tracking-wider mb-3 pb-1 border-b ${
              templateFamily === "classic"
                ? "font-serif border-slate-900"
                : templateFamily === "contemporary"
                  ? "font-mono font-black border-slate-950 text-slate-950"
                  : "text-slate-700 border-slate-200"
            }`}
          >
            {t("print.event.roster")}
          </h2>

          {!event.responsibilities || event.responsibilities.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-3">
              {t("print.event.noRoster")}
            </p>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr
                  className={`border-b ${
                    templateFamily === "contemporary"
                      ? "border-slate-950 text-slate-950 font-mono font-bold"
                      : "border-slate-200 text-slate-500 font-semibold"
                  }`}
                >
                  <th className="py-2 px-2 w-48">{t("print.event.roleCol")}</th>
                  <th className="py-2 px-2">{t("print.event.membersCol")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {event.responsibilities.map((resp) => {
                  const category = categoryMap.get(resp.categoryId);
                  const label = category?.label || resp.categoryId;
                  const assignees = resp.assignees || [];

                  return (
                    <tr
                      key={resp.id}
                      className={
                        templateFamily === "classic" ? "font-serif" : undefined
                      }
                    >
                      <td className="py-2.5 px-2 font-bold text-slate-900">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            templateFamily === "contemporary"
                              ? "border border-slate-900 text-slate-900 font-mono text-[10px]"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        {assignees.length === 0 ? (
                          <span className="text-slate-400 italic">
                            {t("print.event.noAssignee")}
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {assignees.map((a) => (
                              <span
                                key={a.id}
                                className={`px-2 py-0.5 rounded text-slate-800 ${
                                  templateFamily === "contemporary"
                                    ? "bg-slate-200 font-mono text-[10px]"
                                    : "bg-slate-100 border border-slate-200 text-[11px]"
                                }`}
                              >
                                {a.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* EVENT NOTES */}
        {event.notes && (
          <div
            className={`p-3 rounded-lg mt-5 text-xs ${
              templateFamily === "classic"
                ? "border border-slate-300 italic bg-slate-50 font-serif"
                : templateFamily === "contemporary"
                  ? "border-2 border-slate-950 bg-slate-100 font-mono"
                  : "bg-slate-50 border border-slate-200 text-slate-700"
            }`}
          >
            <span className="font-bold block uppercase text-[10px] tracking-wider mb-1">
              {t("print.event.roster")}:
            </span>
            <p className="whitespace-pre-wrap">{event.notes}</p>
          </div>
        )}
      </div>

      <TemplateFooter options={options} churchName={churchName} />
    </div>
  );
};

