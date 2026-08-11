/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sun, Moon, MonitorSmartphone, Check } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

export const AppearanceTab: React.FC<{ active: boolean }> = ({ active }) => {
  const { theme, setTheme } = useTheme();

  if (!active) return null;

  const themes = [
    {
      id: "light",
      title: "Modo Claro",
      description: "Ideal para ambientes bem iluminados.",
      icon: Sun,
      iconClass: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    },
    {
      id: "system",
      title: "Sistema",
      description: "Segue automaticamente o tema do dispositivo.",
      icon: MonitorSmartphone,
      iconClass: "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
    },
    {
      id: "dark",
      title: "Modo Escuro",
      description: "Mais confortável durante a noite.",
      icon: Moon,
      iconClass: "bg-slate-800 text-sky-400",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Aparência & Tema
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Escolhe como pretendes visualizar a aplicação.
          </p>
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
                      ? "border-m3-primary bg-sky-50/50 dark:bg-sky-950/30 ring-2 ring-m3-primary/20 shadow-md"
                      : "border-slate-200 dark:border-slate-800 hover:border-m3-primary/50 hover:shadow-md"
                  }`}
                >
                  {selected && (
                    <div className="absolute top-4 right-4 h-5 w-5 rounded-full bg-m3-primary flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}

                  <div
                    className={`mb-4 inline-flex rounded-2xl p-3 ${item.iconClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
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
    </div>
  );
};
