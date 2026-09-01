/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TranslateFn, useI18n } from "@/src/i18n";
import { Link2, Search, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Service } from "@/src/types";

/** Sum of an order-of-worship's element durations, rounded up to whole minutes. */
export function serviceTotalMinutes(service: Service): number {
  const seconds = (service.elements ?? []).reduce(
    (acc, el) => acc + Math.max(0, Number(el.duration || 0)),
    0,
  );
  return Math.max(1, Math.round(seconds / 60));
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

interface ServiceLinkFieldProps {
  /** Active (non-archived) services to pick from. */
  services: Service[];
  isLoading?: boolean;
  /** Currently linked service id, or null when no service is linked. */
  value: string | null;
  onChange: (serviceId: string | null) => void;
}

/**
 * Searchable service picker for linking an order of worship to an agenda
 * event, plus a small card describing the currently linked service.
 * Selecting a service calls `onChange(serviceId)` — the parent decides what
 * to pre-fill (date, duration, ...) from the service's info.
 */
export const ServiceLinkField: React.FC<ServiceLinkFieldProps> = ({
  services,
  isLoading = false,
  value,
  onChange,
}) => {
  const { t, tc } = useI18n();
  const [draft, setDraft] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const linked = services.find((s) => s.id === value) ?? null;

  // Most recent first — you usually want to link the upcoming culto.
  const sorted = useMemo(
    () =>
      [...services].sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    [services],
  );

  const q = draft.trim().toLowerCase();
  const filtered = useMemo(
    () => (q ? sorted.filter((s) => s.name.toLowerCase().includes(q)) : sorted),
    [sorted, q],
  );

  const pick = (id: string) => {
    onChange(id);
    setDraft("");
    setOpen(false);
    setHighlight(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length > 0) pick(filtered[highlight % filtered.length].id);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => (filtered.length ? (h + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) =>
        filtered.length ? (h - 1 + filtered.length) % filtered.length : 0,
      );
    } else if (e.key === "Escape") {
      setOpen(false);
    } else {
      setOpen(true);
      setHighlight(0);
    }
  };

  // Close the dropdown when clicking anywhere outside the field.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={rootRef} className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={
            isLoading
              ? t("agenda.loadingServices")
              : linked
                ? t("agenda.changeLinkedService")
                : t("agenda.searchServiceToLink")
          }
          className="w-full h-11 pl-10 pr-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#0284c7]"
        />

        {open && filtered.length > 0 && (
          <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1.5">
            {filtered.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s.id);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                  i === highlight
                    ? "bg-slate-100 dark:bg-slate-800"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <span className="w-6 h-6 rounded-lg bg-[#0284c7]/10 text-[#0284c7] flex items-center justify-center shrink-0">
                  <Link2 className="w-3.5 h-3.5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {s.name}
                  </span>
                  <span className="block text-[10px] font-semibold text-slate-400">
                    {formatShortDate(s.date, t)} ·{" "}
                    {t("agenda.minutes", { minutes: serviceTotalMinutes(s) })}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {value && !linked && (
        <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
          {t("agenda.linkedServiceMissing")}
        </p>
      )}

      {linked && (
        <div className="flex items-center gap-3 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/60 dark:bg-sky-950/30 p-3">
          <span className="w-9 h-9 rounded-xl bg-[#0284c7]/10 text-[#0284c7] flex items-center justify-center shrink-0">
            <Link2 className="w-4 h-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
              {linked.name}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {formatShortDate(linked.date, t)} ·{" "}
              {t("agenda.minutes", { minutes: serviceTotalMinutes(linked) })} ·{" "}
              {tc("agenda.elementsCount", (linked.elements ?? []).length)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            title={t("agenda.removeLink")}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!isLoading && services.length === 0 && (
        <p className="text-[11px] font-semibold text-slate-400">
          {t("agenda.noServicesToLink")}
        </p>
      )}
    </div>
  );
};
