/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCan } from "@/src/lib/permissions/client";
import { Can } from "@/src/lib/permissions/components";
import { Button, Input, Spinner } from "@hosanna/shared";
import {
  Calendar,
  Clock,
  Globe,
  Layout,
  Loader2,
  Lock,
  Mic2,
  Music,
  Save,
  Settings2,
  Shield,
  Smartphone,
  Timer,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { authClient } from "../../lib/authClient";

export interface GeneralTabProps {
  active: boolean;
  showToast?: (
    text: string,
    variant: "success" | "error" | "info" | "warning",
  ) => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  active,
  showToast,
}) => {
  const { organization, refetch: refetchAuth } = useAuth();
  const { granted: canManageOrg, loading: canLoading } = useCan(
    "organization.update",
  );

  const [isSaving, setIsSaving] = useState(false);

  // ==========================================
  // ESTADO: Definições da Organização (Requer Permissão)
  // ==========================================
  const [orgFormData, setOrgFormData] = useState({
    locale: "pt-PT",
    timezone: "Europe/Lisbon",
    weekStartsOn: 1, // 0 = Sunday, 1 = Monday
    sermonDuration: 45,
    songDuration: 5,
    showNotes: true,
    showServiceDuration: true,
    autoSave: true,
  });

  // ==========================================
  // ESTADO: Definições do Studio (Preferência Local, Sem Permissão)
  // ==========================================
  const [studioSettings, setStudioSettings] = useState({
    showChordsDefault: true,
  });

  // Sincronizar dados da organização
  useEffect(() => {
    if (organization) {
      const metadata = organization.metadata || {};
      const settings = metadata.settings || {};
      const general = settings.general || {};
      const services = settings.services || {};
      const durations = services.defaultDurations || {};

      setOrgFormData({
        locale: general.locale ?? "pt-PT",
        timezone: general.timezone ?? "Europe/Lisbon",
        weekStartsOn: general.weekStartsOn ?? 1,
        sermonDuration: (durations.sermon ?? 2000) / 60,
        songDuration: (durations.song ?? 230) / 60,
        showNotes: services.showNotes ?? true,
        showServiceDuration: services.showServiceDuration ?? true,
        autoSave: services.autoSave ?? true,
      });
    }
  }, [organization]);

  // Carregar preferências locais do Studio
  useEffect(() => {
    const storedChords = localStorage.getItem("@hosanna:showChordsDefault");
    if (storedChords !== null) {
      setStudioSettings({ showChordsDefault: storedChords === "true" });
    }
  }, []);

  if (!active) return null;

  if (canLoading || !organization) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
        <Spinner size="lg" label="A carregar definições..." />
      </div>
    );
  }

  // Guardar Definições da Organização
  const handleSubmitOrgSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageOrg) return;

    try {
      setIsSaving(true);
      const currentMetadata = organization.metadata || {};

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
                  sermon: orgFormData.sermonDuration * 60,
                  song: orgFormData.songDuration * 60,
                },
                showNotes: orgFormData.showNotes,
                showServiceDuration: orgFormData.showServiceDuration,
                autoSave: orgFormData.autoSave,
              },
            },
          },
        },
      });

      await refetchAuth();
      if (showToast)
        showToast("Definições da organização atualizadas!", "success");
    } catch (err) {
      if (showToast)
        showToast("Erro ao guardar definições da organização.", "error");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Guardar Definições do Studio (Auto-save local)
  const handleStudioSettingsChange = (checked: boolean) => {
    setStudioSettings({ showChordsDefault: checked });
    localStorage.setItem("@hosanna:showChordsDefault", checked.toString());
    if (showToast)
      showToast("Preferências de visualização atualizadas.", "success");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Can permission="organization.update">
        <form onSubmit={handleSubmitOrgSettings} className="space-y-6">
          {/* General Settings Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-m3-primary" />
                  Preferências Gerais
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Configure a localização, fusos horários e datas para a sua
                  organização.
                </p>
              </div>
              {!canManageOrg && (
                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  Apenas Leitura
                </span>
              )}
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <Globe className="w-4 h-4 text-slate-400" />
                    Idioma Padrão
                  </label>
                  <select
                    disabled={!canManageOrg || isSaving}
                    value={orgFormData.locale}
                    onChange={(e) =>
                      setOrgFormData({ ...orgFormData, locale: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-m3-primary/50 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 transition-colors"
                  >
                    <option value="pt-PT">Português (Portugal)</option>
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español (España)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Fuso Horário
                  </label>
                  <select
                    disabled={!canManageOrg || isSaving}
                    value={orgFormData.timezone}
                    onChange={(e) =>
                      setOrgFormData({
                        ...orgFormData,
                        timezone: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-m3-primary/50 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 transition-colors"
                  >
                    <option value="Europe/Lisbon">
                      Lisboa (Europe/Lisbon)
                    </option>
                    <option value="America/Sao_Paulo">
                      São Paulo (America/Sao_Paulo)
                    </option>
                    <option value="Europe/London">
                      Londres (Europe/London)
                    </option>
                    <option value="America/New_York">
                      Nova Iorque (America/New_York)
                    </option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    Início da Semana
                  </label>
                  <div className="flex gap-4">
                    {[
                      { value: 0, label: "Domingo" },
                      { value: 1, label: "Segunda-feira" },
                    ].map((day) => (
                      <label
                        key={day.value}
                        className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                          orgFormData.weekStartsOn === day.value
                            ? "border-m3-primary bg-m3-primary/5 text-m3-primary"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        } ${!canManageOrg ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <input
                          type="radio"
                          name="weekStartsOn"
                          disabled={!canManageOrg || isSaving}
                          checked={orgFormData.weekStartsOn === day.value}
                          onChange={() =>
                            setOrgFormData({
                              ...orgFormData,
                              weekStartsOn: day.value,
                            })
                          }
                          className="w-4 h-4 text-m3-primary focus:ring-m3-primary"
                        />
                        <span className="text-sm font-semibold">
                          {day.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Services Settings Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Timer className="w-5 h-5 text-indigo-500" />
                Configuração de Cultos e Eventos
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Defina tempos padrão e comportamentos para os alinhamentos
                musicais e eventos.
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Input
                  label="Duração Média de um Cântico (minutos)"
                  type="number"
                  min={1}
                  disabled={!canManageOrg || isSaving}
                  value={orgFormData.songDuration}
                  onChange={(e) =>
                    setOrgFormData({
                      ...orgFormData,
                      songDuration: Number(e.target.value),
                    })
                  }
                  icon={<Music className="w-4 h-4 text-slate-400" />}
                  placeholder="5"
                />
                <Input
                  label="Duração Média do Sermão/Pregação (minutos)"
                  type="number"
                  min={5}
                  disabled={!canManageOrg || isSaving}
                  value={orgFormData.sermonDuration}
                  onChange={(e) =>
                    setOrgFormData({
                      ...orgFormData,
                      sermonDuration: Number(e.target.value),
                    })
                  }
                  icon={<Mic2 className="w-4 h-4 text-slate-400" />}
                  placeholder="45"
                />
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                  <Shield className="w-4 h-4 text-slate-400" />
                  Funcionalidades do Culto
                </h4>

                {[
                  {
                    id: "showServiceDuration",
                    label: "Mostrar duração total do Culto",
                    description:
                      "Calcula e apresenta o tempo estimado total no topo dos alinhamentos.",
                    checked: orgFormData.showServiceDuration,
                  },
                  {
                    id: "showNotes",
                    label: "Ativar notas da equipa",
                    description:
                      "Permitir que músicos e técnicos adicionem notas específicas nos itens do culto.",
                    checked: orgFormData.showNotes,
                  },
                  {
                    id: "autoSave",
                    label: "Guardar automaticamente (Autosave)",
                    description:
                      "Guarda as edições nos cultos em rascunho de forma contínua para evitar perda de dados.",
                    checked: orgFormData.autoSave,
                  },
                ].map((toggle) => (
                  <label
                    key={toggle.id}
                    className={`flex items-start gap-3.5 p-4 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors ${
                      canManageOrg && !isSaving
                        ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
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
                        className="w-4.5 h-4.5 text-m3-primary border-slate-300 rounded focus:ring-m3-primary"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {toggle.label}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {toggle.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Action Org Settings */}
          {canManageOrg && (
            <div className="flex items-center justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSaving}
                icon={
                  isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )
                }
                className="w-full sm:w-auto shadow-md"
              >
                {isSaving
                  ? "A guardar organizações..."
                  : "Guardar Definições da Organização"}
              </Button>
            </div>
          )}
        </form>
      </Can>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layout className="w-5 h-5 text-emerald-500" />
              Definições do Studio
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Preferências de visualização exclusivas para a sua conta e
              dispositivo atual.
            </p>
          </div>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold">
            <Smartphone className="w-3.5 h-3.5" />
            Preferência Local
          </span>
        </div>

        <div className="p-6">
          <label className="flex items-start gap-3.5 p-4 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center h-5 mt-0.5">
              <input
                type="checkbox"
                checked={studioSettings.showChordsDefault}
                onChange={(e) => handleStudioSettingsChange(e.target.checked)}
                className="w-4.5 h-4.5 text-emerald-500 border-slate-300 rounded focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Mostrar Acordes por Defeito ao Visualizar e Editar Cânticos
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Ativa a apresentação automática de acordes sobre a letra no
                visualizador ChordPro e no editor. (Guarda automaticamente)
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Espaço extra no fundo da página */}
      <div className="h-4" />
    </div>
  );
};
