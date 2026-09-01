/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

interface MiniCalendarProps {
  visibleMonth: Date;
  selectedDate: string;
  /** Set of yyyy-mm-dd strings that should render a dot indicator. */
  markedDates: Set<string>;
  onSelectDate: (date: string) => void;
  onChangeMonth: (delta: number) => void;
  onGoToday: () => void;
}

const WEEKDAY_LABELS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

const MONTH_LABELS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function buildMonthGrid(visibleMonth: Date): (Date | null)[] {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  // Monday-first offset (getDay(): 0=Sun..6=Sat)
  const offset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  visibleMonth,
  selectedDate,
  markedDates,
  onSelectDate,
  onChangeMonth,
  onGoToday,
}) => {
  const cells = buildMonthGrid(visibleMonth);
  const todayIso = toIso(new Date());

  return (
    <div className="bg-white dark:bg-slate-900 border border-m3-border rounded-2xl p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
          {MONTH_LABELS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChangeMonth(-1)}
            className="p-1 rounded-lg hover:bg-m3-hover text-m3-secondary hover:text-m3-text transition-colors cursor-pointer"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChangeMonth(1)}
            className="p-1 rounded-lg hover:bg-m3-hover text-m3-secondary hover:text-m3-text transition-colors cursor-pointer"
            aria-label="Mês seguinte"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={onGoToday}
            className="ml-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-m3-border text-m3-secondary hover:bg-m3-hover hover:text-m3-text transition-colors cursor-pointer"
          >
            Hoje
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((w) => (
          <div
            key={w}
            className="text-center text-[10px] font-black text-m3-secondary opacity-60 py-1"
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="aspect-square" />;
          const iso = toIso(date);
          const isSelected = iso === selectedDate;
          const isToday = iso === todayIso;
          const hasMark = markedDates.has(iso);

          return (
            <button
              key={iso}
              onClick={() => onSelectDate(iso)}
              className={`aspect-square rounded-full flex flex-col items-center justify-center text-xs font-bold transition-colors cursor-pointer relative ${
                isSelected
                  ? "bg-[#0284c7] text-white shadow-sm"
                  : isToday
                    ? "border border-[#0284c7] text-[#0284c7]"
                    : "text-slate-700 dark:text-slate-300 hover:bg-m3-hover"
              }`}
            >
              {date.getDate()}
              {hasMark && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#0284c7]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { toIso };
