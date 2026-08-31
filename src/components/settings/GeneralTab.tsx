/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Spinner } from "@/src/components/common";
import { useCan } from "@/src/lib/permissions/client";
import {
  Calendar,
  Clock,
  Globe,
  Loader2,
  Lock,
  Mic2,
  Music,
  RotateCcw,
  Save,
  Settings2,
  Shield,
  Timer,
} from "lucide-react";
import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useOrgSettings } from "../../hooks/useOrgSettings";
import { useI18n } from "../../i18n";
import {
  DurationField,
  durationInputToSeconds,
  secondsToDurationInput,
} from "../DurationField";
import { ResponsibilityCategoriesCard } from "./ResponsibilityCategoriesCard";

export interface GeneralTabProps {
  active: boolean;
  showToast?: (
    text: string,
    variant: "success" | "error" | "info" | "warning",
  ) => void;
}

const SONG_PRESETS = [
  { label: "3:30", sec: 210 },
  { label: "4:00", sec: 240 },
  { label: "5:00", sec: 300 },
  { label: "6:30", sec: 390 },
];

const SERMON_PRESETS = [
  { label: "30:00", sec: 1800 },
  { label: "40:00", sec: 2400 },
  { label: "45:00", sec: 2700 },
  { label: "60:00", sec: 3600 },
];

export const GeneralTab: React.FC<GeneralTabProps> = ({
  active,
  showToast,
}) => {
  const { organization } = useAuth();
  const { t } = useI18n();
  const { granted: canManageOrg, loading: canLoading } = useCan(
    "organization.update",
  );

  const { settings, isSaving, update, reset, save } = useOrgSettings();

  // Local MM:SS text state for the duration inputs — committed to hook on blur/preset
  const [songRaw, setSongRaw] = React.useState(
    secondsToDurationInput(settings.services.songDuration),
  );
  const [sermonRaw, setSermonRaw] = React.useState(
    secondsToDurationInput(settings.services.sermonDuration),
  );

  // Keep local text in sync when hook resets/saves
  React.useEffect(() => {
    setSongRaw(secondsToDurationInput(settings.services.songDuration));
  }, [settings.services.songDuration]);
  React.useEffect(() => {
    setSermonRaw(secondsToDurationInput(settings.services.sermonDuration));
  }, [settings.services.sermonDuration]);

  if (!active) return null;

  if (canLoading || !organization) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
        <Spinner size="lg" label={t("settings.general.loading")} />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageOrg) return;
    try {
      await save();
      showToast?.(t("settings.toast.orgSaved"), "success");
    } catch (err) {
      showToast?.(
        t("settings.toast.orgSaveError", {
          error:
            (err as { message?: string })?.message ||
            t("settings.general.commError"),
        }),
        "error",
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      {/* ── 1. LOCALIZAÇÃO E DATAS ─────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-m3-primary" />
              {t("settings.general.title")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t("settings.general.desc")}
            </p>
          </div>
          {!canManageOrg && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              {t("settings.general.readOnly")}
            </span>
          )}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Idioma */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                <Globe className="w-4 h-4 text-slate-400" />
                {t("settings.general.orgLanguage")}
              </label>
              <select
                disabled={!canManageOrg || isSaving}
                value={settings.general.locale}
                onChange={(e) => update("general", "locale", e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-m3-primary/40 focus:border-m3-primary disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <option value="pt-PT">
                  {t("settings.general.locales.ptPT")}
                </option>
                <option value="pt-BR">
                  {t("settings.general.locales.ptBR")}
                </option>
                <option value="en-US">
                  {t("settings.general.locales.enUS")}
                </option>
                <option value="es-ES">
                  {t("settings.general.locales.esES")}
                </option>
              </select>
            </div>

            {/* Fuso Horário */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                <Clock className="w-4 h-4 text-slate-400" />
                {t("settings.general.timezone")}
              </label>
              <select
                disabled={!canManageOrg || isSaving}
                value={settings.general.timezone}
                onChange={(e) => update("general", "timezone", e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-m3-primary/40 focus:border-m3-primary disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <optgroup label={t("settings.general.timezones.portugalGroup")}>
                  <option value="Europe/Lisbon">
                    {t("settings.general.timezones.lisbon")}
                  </option>
                  <option value="Atlantic/Azores">
                    {t("settings.general.timezones.azores")}
                  </option>
                </optgroup>
                <optgroup label={t("settings.general.timezones.brazilGroup")}>
                  <option value="America/Sao_Paulo">
                    {t("settings.general.timezones.saoPaulo")}
                  </option>
                  <option value="America/Manaus">
                    {t("settings.general.timezones.manaus")}
                  </option>
                </optgroup>
                <optgroup
                  label={t("settings.general.timezones.otherRegionsGroup")}
                >
                  <option value="Europe/London">
                    {t("settings.general.timezones.london")}
                  </option>
                  <option value="America/New_York">
                    {t("settings.general.timezones.newYork")}
                  </option>
                  <option value="UTC">
                    {t("settings.general.timezones.utc")}
                  </option>
                </optgroup>
              </select>
            </div>

            {/* Primeiro Dia da Semana */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                <Calendar className="w-4 h-4 text-slate-400" />
                {t("settings.general.weekStartsOn")}
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                {[
                  {
                    value: 1,
                    label: t("settings.general.monday"),
                    desc: t("settings.general.mondayDesc"),
                  },
                  {
                    value: 0,
                    label: t("settings.general.sunday"),
                    desc: t("settings.general.sundayDesc"),
                  },
                ].map((day) => {
                  const isChecked = settings.general.weekStartsOn === day.value;
                  return (
                    <label
                      key={day.value}
                      className={`flex flex-col p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? "border-m3-primary bg-m3-primary/5 text-m3-primary ring-1 ring-m3-primary/30"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                      } ${!canManageOrg ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">{day.label}</span>
                        <input
                          type="radio"
                          name="weekStartsOn"
                          disabled={!canManageOrg || isSaving}
                          checked={isChecked}
                          onChange={() =>
                            update("general", "weekStartsOn", day.value)
                          }
                          className="w-4 h-4 text-m3-primary focus:ring-m3-primary cursor-pointer"
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        {day.desc}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. DURAÇÕES & COMPORTAMENTO ───────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Timer className="w-5 h-5 text-indigo-500" />
            {t("settings.general.durationsTitle")}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("settings.general.durationsDesc")}
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duração de Cântico — uses shared DurationField */}
            <DurationField
              label={t("settings.general.songLabel")}
              icon={<Music className="w-4 h-4 text-indigo-500" />}
              value={songRaw}
              onChange={(v) => {
                setSongRaw(v);
                // commit seconds on change so badge is live
                update("services", "songDuration", durationInputToSeconds(v));
              }}
              accentRingClass="focus:ring-indigo-400/60"
              badgeClass="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200/50 dark:border-indigo-800/50"
              presets={SONG_PRESETS}
              disabled={!canManageOrg || isSaving}
              placeholder="05:00"
            />

            {/* Duração do Sermão */}
            <DurationField
              label={t("settings.general.sermonLabel")}
              icon={<Mic2 className="w-4 h-4 text-rose-500" />}
              value={sermonRaw}
              onChange={(v) => {
                setSermonRaw(v);
                update("services", "sermonDuration", durationInputToSeconds(v));
              }}
              accentRingClass="focus:ring-rose-400/60"
              badgeClass="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200/50 dark:border-rose-800/50"
              presets={SERMON_PRESETS}
              disabled={!canManageOrg || isSaving}
              placeholder="40:00"
            />
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Comportamento */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5 mb-3">
              <Shield className="w-4 h-4 text-slate-400" />
              {t("settings.general.behaviorTitle")}
            </h4>

            {(
              [
                {
                  id: "showServiceDuration" as const,
                  label: t("settings.general.showDuration"),
                  description: t("settings.general.showDurationDesc"),
                  checked: settings.services.showServiceDuration,
                },
                {
                  id: "showNotes" as const,
                  label: t("settings.general.showNotes"),
                  description: t("settings.general.showNotesDesc"),
                  checked: settings.services.showNotes,
                },
                {
                  id: "autoSave" as const,
                  label: t("settings.general.autoSave"),
                  description: t("settings.general.autoSaveDesc"),
                  checked: settings.services.autoSave,
                },
              ] as const
            ).map((toggle) => (
              <label
                key={toggle.id}
                className={`flex items-start gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors ${
                  canManageOrg && !isSaving
                    ? "cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    : "opacity-75 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    type="checkbox"
                    disabled={!canManageOrg || isSaving}
                    checked={toggle.checked}
                    onChange={(e) =>
                      update("services", toggle.id, e.target.checked)
                    }
                    className="w-4.5 h-4.5 text-m3-primary border-slate-300 rounded focus:ring-m3-primary cursor-pointer"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {toggle.label}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {toggle.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        {canManageOrg && (
          <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-900/70 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <button
              type="button"
              onClick={reset}
              disabled={isSaving}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t("settings.general.reset")}
            </button>

            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
              icon={
                isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )
              }
            >
              {isSaving
                ? t("settings.general.saving")
                : t("settings.general.save")}
            </Button>
          </div>
        )}
      </div>

      {/* ── 3. RESPONSABILIDADES DA AGENDA ─────────────────────────── */}
      <ResponsibilityCategoriesCard disabled={!canManageOrg || isSaving} />
    </form>
  );
};
