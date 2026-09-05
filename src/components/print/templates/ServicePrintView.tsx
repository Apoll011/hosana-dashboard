/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Service, ServiceElement, Song } from "@/src/types";
import { useI18n } from "@/src/lib/i18n";
import React, { useMemo } from "react";
import { PrintOptions } from "../types";
import { SongPrintView } from "./SongPrintView";
import { TemplateFooter } from "./TemplateFooter";
import { TemplateHeader } from "./TemplateHeader";

interface ServicePrintViewProps {
  service: Service;
  songs?: Song[];
  options: PrintOptions;
  churchName?: string;
  churchLogo?: string | null;
  churchShortName?: string;
  accentColor?: string;
}

const formatDuration = (seconds?: number) => {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s > 0 ? `${s}s` : ""}`;
};

export const ServicePrintView: React.FC<ServicePrintViewProps> = ({
  service,
  songs = [],
  options,
  churchName,
  churchLogo,
  churchShortName,
  accentColor,
}) => {
  const { t } = useI18n();
  const { templateFamily, includeServiceSongs } = options;

  // Format date
  const formattedDate = useMemo(() => {
    if (!service.date) return "";
    try {
      const d = new Date(service.date);
      return d.toLocaleDateString("pt-PT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return service.date;
    }
  }, [service.date]);

  const elements = service.elements || [];
  const totalDurationSeconds = elements.reduce(
    (acc, el) => acc + (el.duration || 0),
    0,
  );

  // Map songs in service
  const serviceSongMap = useMemo(() => {
    const map = new Map<string, Song>();
    for (const song of songs) {
      map.set(song.id, song);
    }
    return map;
  }, [songs]);

  const songsToPrint = useMemo(() => {
    if (!includeServiceSongs) return [];
    const result: Song[] = [];
    for (const el of elements) {
      if (el.type === "song" && el.songId) {
        const found = serviceSongMap.get(el.songId);
        if (found) {
          result.push(found);
        }
      }
    }
    return result;
  }, [elements, serviceSongMap, includeServiceSongs]);

  const getElementTypeLabel = (type: ServiceElement["type"]) => {
    switch (type) {
      case "welcome":
        return t("print.service.types.welcome");
      case "scripture":
        return t("print.service.types.scripture");
      case "song":
        return t("print.service.types.song");
      case "message":
        return t("print.service.types.message");
      case "announcement":
        return t("print.service.types.announcement");
      default:
        return t("print.service.types.moment");
    }
  };

  /** Trim text to 3 lines for scripture/passage content */
  const trimToThreeLines = (text?: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    if (lines.length <= 3) return text;
    return lines.slice(0, 3).join("\n") + "…";
  };

  return (
    <div className="service-print-container">
      {/* ── ORDER OF SERVICE RUNDOWN ── */}
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
            title={service.name}
            subtitle={formattedDate}
            metaBadge={t("print.service.badge")}
            options={options}
          />

          {/* SERVICE NOTES */}
          {service.notes && (
            <div
              className={`p-3 rounded-lg mb-5 text-xs ${
                templateFamily === "classic"
                  ? "border border-slate-300 italic bg-slate-50 font-serif"
                  : templateFamily === "contemporary"
                    ? "border-2 border-slate-950 bg-slate-100 font-mono"
                    : "bg-slate-50 border border-slate-200 text-slate-700"
              }`}
            >
              <span className="font-bold block uppercase text-[10px] tracking-wider mb-1">
                {t("print.service.notes")}
              </span>
              <p className="whitespace-pre-wrap">{service.notes}</p>
            </div>
          )}

          {/* ELEMENTS TABLE / TIMELINE */}
          <div className="my-4">
            <div className="flex items-center justify-between mb-2">
              <h2
                className={`text-sm font-bold uppercase tracking-wider ${
                  templateFamily === "classic"
                    ? "font-serif text-slate-900"
                    : templateFamily === "contemporary"
                      ? "font-mono font-black text-slate-950"
                      : "text-slate-700"
                }`}
              >
                {t("print.service.orderAndSchedule")}
              </h2>
              {totalDurationSeconds > 0 && (
                <span className="text-xs text-slate-500 font-medium">
                  {t("print.service.estimatedDuration", {
                    duration: formatDuration(totalDurationSeconds),
                  })}
                </span>
              )}
            </div>

            {elements.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                {t("print.service.noElements")}
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
                    <th className="py-2 px-2 w-10 text-center">
                      {t("print.service.numberCol")}
                    </th>
                    <th className="py-2 px-2 w-28">
                      {t("print.service.momentCol")}
                    </th>
                    <th className="py-2 px-2">
                      {t("print.service.titleDescCol")}
                    </th>
                    <th className="py-2 px-2">
                      {t("print.service.passageNotesCol")}
                    </th>
                    <th className="py-2 px-2 w-20 text-right">
                      {t("print.service.durationCol")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {elements.map((el, idx) => (
                    <tr
                      key={el.id || idx}
                      className={
                        templateFamily === "classic" ? "font-serif" : undefined
                      }
                    >
                      <td className="py-2.5 px-2 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            templateFamily === "contemporary"
                              ? "border border-slate-900 text-slate-900 uppercase font-mono text-[10px]"
                              : templateFamily === "classic"
                                ? "italic text-slate-700 font-serif"
                                : el.type === "song"
                                  ? "bg-sky-50 text-sky-700 border border-sky-200"
                                  : el.type === "message"
                                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                                    : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {getElementTypeLabel(el.type)}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-bold text-slate-900">
                        {el.title}
                        {el.content && el.type !== "scripture" && (
                          <div className="font-normal text-slate-500 text-[11px] mt-0.5">
                            {el.content}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-slate-600">
                        {el.passage && (
                          <span className="font-medium text-slate-800 mr-2">
                            {el.passage}
                          </span>
                        )}
                        {el.type === "scripture" && el.content && (
                          <span
                            className="italic text-slate-600 text-[11px] block mt-0.5"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {trimToThreeLines(el.content)}
                          </span>
                        )}
                        {el.type !== "scripture" && el.notes && (
                          <span className="italic text-slate-500">
                            {el.notes}
                          </span>
                        )}
                        {!el.passage &&
                          !el.notes &&
                          el.type !== "scripture" &&
                          "—"}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                        {formatDuration(el.duration)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <TemplateFooter options={options} churchName={churchName} />
      </div>

      {/* ── FULL SONGS ATTACHED TO THIS SERVICE (IF ENABLED) ── */}
      {includeServiceSongs &&
        songsToPrint.map((song) => (
          <SongPrintView
            key={song.id}
            song={song}
            options={options}
            churchName={churchName}
            churchLogo={churchLogo}
            churchShortName={churchShortName}
            accentColor={accentColor}
          />
        ))}
    </div>
  );
};
