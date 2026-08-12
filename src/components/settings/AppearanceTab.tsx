/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCan } from "@/src/lib/permissions/client";
import { Can } from "@/src/lib/permissions/components";
import { Button, Input } from "@hosanna/shared";
import {
  Check,
  Image as ImageIcon,
  Loader2,
  MonitorSmartphone,
  Moon,
  Palette,
  Save,
  Sun,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { authClient } from "../../lib/authClient";

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
  const { organization, refetch: refetchAuth } = useAuth();
  const { granted: canManageOrg } = useCan("organization.update");

  const [isSaving, setIsSaving] = useState(false);

  // Estado para definições de aparência da Organização
  const [orgAppearance, setOrgAppearance] = useState({
    accentColor: "#0ea5e9", // cor primária por defeito (sky-500)
    showBranding: true,
  });

  useEffect(() => {
    if (organization) {
      const metadata = organization.metadata || {};
      const settings = metadata.settings || {};
      const appearance = settings.appearance || {};

      setOrgAppearance({
        accentColor: appearance.accentColor ?? "#0ea5e9",
        showBranding: appearance.showBranding ?? true,
      });
    }
  }, [organization]);

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

  const handleSubmitOrgAppearance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageOrg || !organization) return;

    try {
      setIsSaving(true);
      const currentMetadata = organization.metadata || {};

      await authClient.organization.update({
        data: {
          metadata: {
            ...currentMetadata,
            settings: {
              ...currentMetadata.settings,
              appearance: {
                ...currentMetadata.settings?.appearance,
                accentColor: orgAppearance.accentColor,
                showBranding: orgAppearance.showBranding,
              },
            },
          },
        },
      });

      await refetchAuth();
      if (showToast)
        showToast("Identidade visual da organização atualizada!", "success");
    } catch (err) {
      if (showToast) showToast("Erro ao guardar as definições.", "error");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
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
      </div>

      {/* ========================================== */}
      {/* IDENTIDADE VISUAL DA ORGANIZAÇÃO (Admin)   */}
      {/* ========================================== */}
      <Can permission="organization.update">
        <form onSubmit={handleSubmitOrgAppearance}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-rose-500" />
                Identidade Visual da Igreja
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Personalize as cores e a presença da marca para todos os membros
                e ecrãs públicos.
              </p>
            </div>

            <div className="p-6 space-y-8">
              {/* Seletor de Cor de Destaque */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wide mb-3">
                  <Palette className="w-4 h-4 text-slate-400" />
                  Cor de Destaque (Accent Color)
                </label>
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                  {/* Color Picker Nativo */}
                  <div className="relative shrink-0">
                    <input
                      type="color"
                      disabled={isSaving}
                      value={orgAppearance.accentColor}
                      onChange={(e) =>
                        setOrgAppearance({
                          ...orgAppearance,
                          accentColor: e.target.value,
                        })
                      }
                      className="w-14 h-14 rounded-xl cursor-pointer border-0 p-0 bg-transparent overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-xl disabled:opacity-50"
                      title="Escolher Cor"
                    />
                    <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-slate-200 dark:ring-slate-700 pointer-events-none" />
                  </div>

                  <div className="flex-1 max-w-xs">
                    <Input
                      disabled={isSaving}
                      value={orgAppearance.accentColor}
                      onChange={(e) =>
                        setOrgAppearance({
                          ...orgAppearance,
                          accentColor: e.target.value,
                        })
                      }
                      placeholder="#000000"
                      className="font-mono uppercase"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Esta cor será aplicada em painéis públicos, botões partilhados
                  e relatórios exportados.
                </p>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* Branding Toggle */}
              <div>
                <label
                  className={`flex items-start gap-3.5 p-4 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors ${
                    !isSaving
                      ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      : "opacity-75 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      type="checkbox"
                      disabled={isSaving}
                      checked={orgAppearance.showBranding}
                      onChange={(e) =>
                        setOrgAppearance({
                          ...orgAppearance,
                          showBranding: e.target.checked,
                        })
                      }
                      className="w-4.5 h-4.5 text-rose-500 border-slate-300 rounded focus:ring-rose-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                      Mostrar Logótipo e Nome da Organização
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Apresenta o logótipo da igreja nos cabeçalhos de
                      alinhamentos públicos, letras projetadas e partilhas.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer Action Org Appearance */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-900/50">
              <Button
                type="submit"
                variant="primary"
                size="md"
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
                  ? "A guardar identidade visual..."
                  : "Guardar Identidade Visual"}
              </Button>
            </div>
          </div>
        </form>
      </Can>

      {/* Espaço extra no fundo da página */}
      <div className="h-4" />
    </div>
  );
};
