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
  Music2,
  Sliders,
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

interface ThemeOption {
  id: "light" | "dark" | "system";
  title: string;
  description: string;
  icon: React.ElementType;
  badge: string;
  previewBg: string;
}

export const AppearanceTab: React.FC<AppearanceTabProps> = ({
  active,
  showToast,
}) => {
  const { theme, setTheme } = useTheme();
  const { settings, updateSetting } = usePersonalSettings();

  const [studioSettings, setStudioSettings] = useState({
    showChordsDefault: true,
  });

  // Carregar preferências locais do Studio
  useEffect(() => {
    try {
      const storedChords = localStorage.getItem("@hosanna:showChordsDefault");
      if (storedChords !== null) {
        setStudioSettings({ showChordsDefault: storedChords === "true" });
      }
    } catch {
      // Fallback gracioso se localStorage estiver bloqueado
    }
  }, []);

  if (!active) return null;

  const themes: ThemeOption[] = [
    {
      id: "light",
      title: "Modo Claro",
      description: "Ambientes iluminados e impressão.",
      icon: Sun,
      badge: "Diurno",
      previewBg:
        "from-amber-500/10 to-orange-500/5 text-amber-600 dark:text-amber-400",
    },
    {
      id: "system",
      title: "Automático",
      description: "Sincroniza com o tema do dispositivo.",
      icon: MonitorSmartphone,
      badge: "Adaptativo",
      previewBg:
        "from-slate-500/10 to-slate-600/5 text-slate-700 dark:text-slate-300",
    },
    {
      id: "dark",
      title: "Modo Escuro",
      description: "Confortável para a noite e púlpito.",
      icon: Moon,
      badge: "Noturno",
      previewBg:
        "from-indigo-500/10 to-sky-500/5 text-sky-600 dark:text-sky-400",
    },
  ];

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    showToast?.(
      `Tema alterado para ${newTheme === "system" ? "Automático" : newTheme === "light" ? "Modo Claro" : "Modo Escuro"}.`,
      "info",
    );
  };

  const handleFolderTreeToggle = (checked: boolean) => {
    updateSetting("showFolderTree", checked);
    showToast?.(
      checked
        ? "Árvore de pastas visível na barra lateral."
        : "Árvore de pastas oculta.",
      "success",
    );
  };

  const handleStudioSettingsChange = (checked: boolean) => {
    setStudioSettings({ showChordsDefault: checked });
    try {
      localStorage.setItem("@hosanna:showChordsDefault", checked.toString());
    } catch {
      // Silently ignore storage errors
    }
    showToast?.(
      checked
        ? "Acordes ativos por predefinição nos cânticos."
        : "Apenas letra visível por predefinição.",
      "success",
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* ========================================== */}
      {/* 1. TEMA & EXPERIÊNCIA VISUAL               */}
      {/* ========================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MonitorSmartphone className="w-5 h-5 text-m3-primary" />
              Tema & Aparência da Aplicação
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Personalize o esquema de cores e a luminosidade da interface no
              seu ecrã.
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
                  onClick={() => handleThemeChange(item.id)}
                  aria-pressed={selected}
                  className={`group relative rounded-2xl border p-5 text-left transition-all duration-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-m3-primary/50 ${
                    selected
                      ? "border-m3-primary bg-m3-primary/5 ring-2 ring-m3-primary/20 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-900/40"
                  }`}
                >
                  {selected && (
                    <div className="absolute top-4 right-4 h-5 w-5 rounded-full bg-m3-primary flex items-center justify-center shadow-xs">
                      <Check className="h-3.5 w-3.5 text-white stroke-[2.5]" />
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`inline-flex rounded-xl p-2.5 bg-linear-to-br border border-slate-200/50 dark:border-slate-700/50 ${item.previewBg}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 2. NAVEGAÇÃO & PAINÉIS LATERAIS            */}
      {/* ========================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-500" />
              Navegação & Estrutura
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Ajuste como os repertórios e pastas são dispostos na sua área de
              trabalho.
            </p>
          </div>
        </div>

        <div className="p-6">
          <label className="flex items-start gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
            <div className="flex items-center h-5 mt-0.5">
              <input
                type="checkbox"
                checked={settings.showFolderTree}
                onChange={(e) => handleFolderTreeToggle(e.target.checked)}
                className="w-4.5 h-4.5 text-m3-primary border-slate-300 rounded focus:ring-m3-primary cursor-pointer"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-slate-400" />
                Mostrar Árvore Hierárquica de Pastas
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Apresenta a estrutura completa de pastas e subpastas de músicas
                na barra lateral esquerda.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* ========================================== */}
      {/* 3. DEFINIÇÕES DO STUDIO & ACORDES          */}
      {/* ========================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layout className="w-5 h-5 text-emerald-500" />
              Preferências do Studio Musical
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Opções padrão de visualização de cifras e letra para este
              navegador.
            </p>
          </div>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold">
            <Smartphone className="w-3.5 h-3.5" />
            Neste Dispositivo
          </span>
        </div>

        <div className="p-6">
          <label className="flex items-start gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
            <div className="flex items-center h-5 mt-0.5">
              <input
                type="checkbox"
                checked={studioSettings.showChordsDefault}
                onChange={(e) => handleStudioSettingsChange(e.target.checked)}
                className="w-4.5 h-4.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Music2 className="w-4 h-4 text-slate-400" />
                Exibir Acordes por Predefinição
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Ativa automaticamente a linha de acordes (ChordPro) ao abrir o
                visualizador de cânticos, ensaio e modo de projeção para
                músicos.
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
