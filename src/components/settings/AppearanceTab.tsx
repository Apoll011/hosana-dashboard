/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { usePersonalSettings } from "@/src/hooks/usePersonalSettings";
import {
  Check,
  FolderTree,
  Layout,
  MonitorSmartphone,
  Moon,
  Smartphone,
  Sun,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";

export interface AppearanceTabProps {
  active: boolean;
  showToast?: (
    text: string,
    variant: "success" | "error" | "info" | "warning",
  ) => void;
}

export const AppearanceTab: React.FC<AppearanceTabProps> = ({
  active,
  showToast,
}) => {
  const { theme, setTheme } = useTheme();
  const { settings, updateSetting } = usePersonalSettings();

  if (!active) return null;

  const themes = [
    {
      id: "light",
      title: "Modo Claro",
      description: "Ideal para ambientes bem iluminados.",
      icon: Sun,
      iconClass:
        "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    },
    {
      id: "system",
      title: "Sistema",
      description: "Segue automaticamente o tema do dispositivo.",
      icon: MonitorSmartphone,
      iconClass:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    },
    {
      id: "dark",
      title: "Modo Escuro",
      description: "Mais confortável durante a noite e cultos.",
      icon: Moon,
      iconClass: "bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
    },
  ];

  const [studioSettings, setStudioSettings] = useState({
    showChordsDefault: true,
  });

  // Carregar preferências locais do Studio
  useEffect(() => {
    const storedChords = localStorage.getItem("@hosanna:showChordsDefault");
    if (storedChords !== null) {
      setStudioSettings({ showChordsDefault: storedChords === "true" });
    }
  }, []);

  // Guardar Definições do Studio (Auto-save local)
  const handleStudioSettingsChange = (checked: boolean) => {
    setStudioSettings({ showChordsDefault: checked });
    localStorage.setItem("@hosanna:showChordsDefault", checked.toString());
    if (showToast)
      showToast("Preferências de visualização atualizadas.", "success");
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MonitorSmartphone className="w-5 h-5 text-m3-primary" />
              Aparência & Tema
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Escolha como prefere visualizar a aplicação no seu dispositivo.
            </p>
          </div>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold">
            <User className="w-3.5 h-3.5" />
            Preferência Pessoal
          </span>
        </div>

        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {themes.map((item) => {
              const Icon = item.icon;
              const selected = theme === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setTheme(item.id as "light" | "dark" | "system")
                  }
                  className={`group relative rounded-2xl border p-5 text-left transition-all duration-200 cursor-pointer ${
                    selected
                      ? "border-m3-primary bg-sky-50/50 dark:bg-sky-950/30 ring-2 ring-m3-primary/20 shadow-md scale-[1.02]"
                      : "border-slate-200 dark:border-slate-800 hover:border-m3-primary/40 hover:shadow-sm"
                  }`}
                >
                  {selected && (
                    <div className="absolute top-4 right-4 h-5 w-5 rounded-full bg-m3-primary flex items-center justify-center shadow-sm">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}

                  <div
                    className={`mb-4 inline-flex rounded-2xl p-3 transition-colors ${item.iconClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {item.title}
                  </h3>

                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-6">
          <label
            className={`flex items-start gap-3.5 p-4 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50`}
          >
            <div className="flex items-center h-5 mt-0.5">
              <input
                type="checkbox"
                checked={settings.showFolderTree}
                onChange={(e) =>
                  updateSetting("showFolderTree", e.target.checked)
                }
                className="w-4.5 h-4.5 text-rose-500 border-slate-300 rounded focus:ring-rose-500"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-slate-400" />
                Mostrar Árvore de Pastas
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Apresenta a árvore de pastas na barra lateral.
              </p>
            </div>
          </label>
        </div>
      </div>

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
