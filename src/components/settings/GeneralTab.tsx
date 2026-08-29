/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCan } from "@/src/lib/permissions/client";
import { Button, Input, Spinner } from "@/src/components/common";
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
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../i18n";
import { authClient } from "../../lib/authClient";

export interface GeneralTabProps {
  active: boolean;
  showToast?: (
    text: string,
    variant: "success" | "error" | "info" | "warning",
  ) => void;
}

interface GeneralOrgSettings {
  locale: string;
  timezone: string;
  weekStartsOn: number;
  sermonDurationMMSS: string; // formato "MM:SS" para UI
  songDurationMMSS: string; // formato "MM:SS" para UI
  showNotes: boolean;
  showServiceDuration: boolean;
  autoSave: boolean;
}

interface OrgMetadataStructure {
  settings?: {
    general?: {
      locale?: string;
      timezone?: string;
      weekStartsOn?: number;
    };
    services?: {
      defaultDurations?: {
        sermon?: number; // em segundos no backend
        song?: number; // em segundos no backend
      };
      showNotes?: boolean;
      showServiceDuration?: boolean;
      autoSave?: boolean;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Helpers para conversão e validação MM:SS <-> Segundos
function secondsToMMSS(totalSeconds: number): string {
  const safeSec = Math.max(0, Math.floor(totalSeconds || 0));
  const mins = Math.floor(safeSec / 60);
  const secs = safeSec % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function parseMMSSToSeconds(value: string, fallbackSeconds = 300): number {
  if (!value || typeof value !== "string") return fallbackSeconds;
  const clean = value.trim();

  // Caso seja inserido formato MM:SS ou M:SS
  if (clean.includes(":")) {
    const parts = clean.split(":");
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    const total = mins * 60 + secs;
    return total > 0 ? total : fallbackSeconds;
  }

  // Se o utilizador digitar apenas um número inteiro (ex: "5"), assume como minutos
  const numeric = parseInt(clean, 10);
  if (!isNaN(numeric) && numeric > 0) {
    return numeric * 60;
  }

  return fallbackSeconds;
}

function formatHumanDuration(
  seconds: number,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return t("settings.general.seg", { count: secs });
  if (secs === 0) return t("settings.general.min", { count: mins });
  return t("settings.general.minAndSeg", { min: mins, sec: secs });
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

const DEFAULT_SETTINGS: GeneralOrgSettings = {
  locale: "pt-PT",
  timezone: "Europe/Lisbon",
  weekStartsOn: 1, // 0 = Domingo, 1 = Segunda-feira
  sermonDurationMMSS: "40:00",
  songDurationMMSS: "05:00",
  showNotes: true,
  showServiceDuration: true,
  autoSave: true,
};

export const GeneralTab: React.FC<GeneralTabProps> = ({
  active,
  showToast,
}) => {
  const { organization, refetch: refetchAuth } = useAuth();
  const { t } = useI18n();
  const { granted: canManageOrg, loading: canLoading } = useCan(
    "organization.update",
  );

  const [isSaving, setIsSaving] = useState(false);
  const [orgFormData, setOrgFormData] =
    useState<GeneralOrgSettings>(DEFAULT_SETTINGS);
  const [initialData, setInitialData] =
    useState<GeneralOrgSettings>(DEFAULT_SETTINGS);

  // Sincronizar dados ao carregar organização
  useEffect(() => {
    if (organization) {
      const metadata = (organization.metadata as OrgMetadataStructure) || {};
      const settings = metadata.settings || {};
      const general = settings.general || {};
      const services = settings.services || {};
      const durations = services.defaultDurations || {};

      const songSec = durations.song ?? 300; // 5 min por defeito
      const sermonSec = durations.sermon ?? 2400; // 40 min por defeito

      const loaded: GeneralOrgSettings = {
        locale: general.locale ?? DEFAULT_SETTINGS.locale,
        timezone: general.timezone ?? DEFAULT_SETTINGS.timezone,
        weekStartsOn: general.weekStartsOn ?? DEFAULT_SETTINGS.weekStartsOn,
        sermonDurationMMSS: secondsToMMSS(sermonSec),
        songDurationMMSS: secondsToMMSS(songSec),
        showNotes: services.showNotes ?? DEFAULT_SETTINGS.showNotes,
        showServiceDuration:
          services.showServiceDuration ?? DEFAULT_SETTINGS.showServiceDuration,
        autoSave: services.autoSave ?? DEFAULT_SETTINGS.autoSave,
      };

      setOrgFormData(loaded);
      setInitialData(loaded);
    }
  }, [organization]);

  if (!active) return null;

  if (canLoading || !organization) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
        <Spinner size="lg" label={t("settings.general.loading")} />
      </div>
    );
  }

  const handleNormalizeOnBlur = (
    field: "songDurationMMSS" | "sermonDurationMMSS",
  ) => {
    const raw = orgFormData[field];
    const fallback = field === "songDurationMMSS" ? 300 : 2400;
    const parsedSeconds = parseMMSSToSeconds(raw, fallback);
    setOrgFormData((prev) => ({
      ...prev,
      [field]: secondsToMMSS(parsedSeconds),
    }));
  };

  const handleReset = () => {
    setOrgFormData(initialData);
  };

  const handleSubmitOrgSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageOrg) return;

    try {
      setIsSaving(true);
      const currentMetadata =
        (organization.metadata as OrgMetadataStructure) || {};

      const songSeconds = parseMMSSToSeconds(orgFormData.songDurationMMSS, 300);
      const sermonSeconds = parseMMSSToSeconds(
        orgFormData.sermonDurationMMSS,
        2400,
      );

      await authClient.organization.update({
        data: {
          metadata: {
            ...currentMetadata,
            settings: {
              ...currentMetadata.settings,
              general: {
                ...currentMetadata.settings?.general,
                locale: orgFormData.locale,
                timezone: orgFormData.timezone,
                weekStartsOn: orgFormData.weekStartsOn,
              },
              services: {
                ...currentMetadata.settings?.services,
                defaultDurations: {
                  song: songSeconds,
                  sermon: sermonSeconds,
                },
                showNotes: orgFormData.showNotes,
                showServiceDuration: orgFormData.showServiceDuration,
                autoSave: orgFormData.autoSave,
              },
            },
          },
        },
      });

      // Normaliza o display
      setOrgFormData((prev) => ({
        ...prev,
        songDurationMMSS: secondsToMMSS(songSeconds),
        sermonDurationMMSS: secondsToMMSS(sermonSeconds),
      }));

      await refetchAuth();
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
    } finally {
      setIsSaving(false);
    }
  };

  // Cálculo das durações para live-preview
  const songSecondsPreview = parseMMSSToSeconds(
    orgFormData.songDurationMMSS,
    300,
  );
  const sermonSecondsPreview = parseMMSSToSeconds(
    orgFormData.sermonDurationMMSS,
    2400,
  );

  return (
    <form
      onSubmit={handleSubmitOrgSettings}
      className="space-y-6 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      {/* ========================================== */}
      {/* 1. LOCALIZAÇÃO E DATAS                     */}
      {/* ========================================== */}
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
                value={orgFormData.locale}
                onChange={(e) =>
                  setOrgFormData({ ...orgFormData, locale: e.target.value })
                }
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
                value={orgFormData.timezone}
                onChange={(e) =>
                  setOrgFormData({ ...orgFormData, timezone: e.target.value })
                }
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
                  const isChecked = orgFormData.weekStartsOn === day.value;
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
                            setOrgFormData({
                              ...orgFormData,
                              weekStartsOn: day.value,
                            })
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

      {/* ========================================== */}
      {/* 2. MODELO DE DURAÇÕES MM:SS & CULTOS       */}
      {/* ========================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Timer className="w-5 h-5 text-indigo-500" />
              {t("settings.general.durationsTitle")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t("settings.general.durationsDesc")}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duração Média de Cântico */}
            <div className="space-y-2.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-m3-bg">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-indigo-500" />
                  {t("settings.general.songLabel")}
                </label>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-200/50 dark:border-indigo-800/50">
                  {formatHumanDuration(songSecondsPreview, t)}
                </span>
              </div>

              <Input
                value={orgFormData.songDurationMMSS}
                disabled={!canManageOrg || isSaving}
                placeholder="05:00"
                onChange={(e) =>
                  setOrgFormData({
                    ...orgFormData,
                    songDurationMMSS: e.target.value,
                  })
                }
                onBlur={() => handleNormalizeOnBlur("songDurationMMSS")}
                className="font-mono text-base tracking-widest text-center"
              />

              {/* Presets Cânticos */}
              {canManageOrg && (
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {t("settings.general.suggestions")}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {SONG_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          setOrgFormData({
                            ...orgFormData,
                            songDurationMMSS: secondsToMMSS(preset.sec),
                          })
                        }
                        className="px-2 py-0.5 text-xs font-mono rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Duração Média do Sermão */}
            <div className="space-y-2.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-m3-bg">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Mic2 className="w-4 h-4 text-rose-500" />
                  {t("settings.general.sermonLabel")}
                </label>
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200/50 dark:border-rose-800/50">
                  {formatHumanDuration(sermonSecondsPreview, t)}
                </span>
              </div>

              <Input
                value={orgFormData.sermonDurationMMSS}
                disabled={!canManageOrg || isSaving}
                placeholder="40:00"
                onChange={(e) =>
                  setOrgFormData({
                    ...orgFormData,
                    sermonDurationMMSS: e.target.value,
                  })
                }
                onBlur={() => handleNormalizeOnBlur("sermonDurationMMSS")}
                className="font-mono text-base tracking-widest text-center"
              />

              {/* Presets Sermão */}
              {canManageOrg && (
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {t("settings.general.suggestions")}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {SERMON_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          setOrgFormData({
                            ...orgFormData,
                            sermonDurationMMSS: secondsToMMSS(preset.sec),
                          })
                        }
                        className="px-2 py-0.5 text-xs font-mono rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Opções dos Alinhamentos */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5 mb-3">
              <Shield className="w-4 h-4 text-slate-400" />
              {t("settings.general.behaviorTitle")}
            </h4>

            {[
              {
                id: "showServiceDuration" as const,
                label: t("settings.general.showDuration"),
                description: t("settings.general.showDurationDesc"),
                checked: orgFormData.showServiceDuration,
              },
              {
                id: "showNotes" as const,
                label: t("settings.general.showNotes"),
                description: t("settings.general.showNotesDesc"),
                checked: orgFormData.showNotes,
              },
              {
                id: "autoSave" as const,
                label: t("settings.general.autoSave"),
                description: t("settings.general.autoSaveDesc"),
                checked: orgFormData.autoSave,
              },
            ].map((toggle) => (
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
                      setOrgFormData({
                        ...orgFormData,
                        [toggle.id]: e.target.checked,
                      })
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

        {/* Footer com Guardar / Reset */}
        {canManageOrg && (
          <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-900/70 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <button
              type="button"
              onClick={handleReset}
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
    </form>
  );
};
