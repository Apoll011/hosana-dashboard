import { Clock3 } from "lucide-react";
import React from "react";
import { useI18n } from "../i18n";

export function secondsToDurationInput(seconds?: number): string {
  const safe = Number.isFinite(seconds)
    ? Math.max(0, Math.floor(seconds || 0))
    : 0;
  const mm = Math.floor(safe / 60);
  const ss = safe % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function durationInputToSeconds(value: string): number {
  const normalized = value.trim();
  if (!normalized) return 0;

  if (!normalized.includes(":")) {
    const raw = Number(normalized.replace(/\D/g, ""));
    return Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
  }

  const [minutesRaw, secondsRaw = "0"] = normalized.split(":");
  const minutes = Number(minutesRaw.replace(/\D/g, "") || "0");
  const seconds = Number(secondsRaw.replace(/\D/g, "") || "0");

  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return 0;
  return Math.max(0, minutes * 60 + seconds);
}

interface DurationFieldProps {
  value: string;
  onChange: (value: string) => void;
  accentRingClass: string;
}

export const DurationField: React.FC<DurationFieldProps> = ({
  value,
  onChange,
  accentRingClass,
}) => {
  const { t } = useI18n();
  const seconds = durationInputToSeconds(value);

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
        {t("serviceModals.duration.label")}
      </label>
      <div className="relative">
        <Clock3 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => onChange(secondsToDurationInput(seconds))}
          placeholder={t("serviceModals.duration.placeholder")}
          className={`w-full pl-9 pr-20 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 ${accentRingClass}`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500">
          {seconds}s
        </span>
      </div>
    </div>
  );
};
