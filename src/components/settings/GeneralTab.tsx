/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Server,
  KeyRound,
  RefreshCw,
  HardDrive,
  Save,
  Shield,
} from "lucide-react";
import { Button, Input, Spinner, ServerSettings } from "@hosanna/shared";
import { useSettings } from "../../hooks/useSettings";

export const GeneralTab: React.FC<{ active: boolean }> = ({ active }) => {
  const { settingsQuery, updateSettings, isUpdating } = useSettings();

  const [formState, setFormState] = useState<ServerSettings>({
    id: "",
    serverName: "Hosanna Studio Server",
    defaultKey: "G",
    syncIntervalSeconds: 30,
    allowPublicRead: false,
    autoBackupEnabled: true,
    maxUploadMB: 50,
    showChordsDefault: true,
    updatedAt: "",
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setFormState((prev) => ({ ...prev, ...settingsQuery.data }));
    }
  }, [settingsQuery.data]);

  if (!active) return null;

  const handleSubmitSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formState);
  };

  if (settingsQuery.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Spinner size="lg" label="A carregar definições do Hosanna Studio..." />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmitSettings} className="space-y-6 max-w-4xl">
      {/* Server Configuration */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-m3-primary" />
          Configuração Geral do Servidor
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nome do Servidor"
            value={formState.serverName}
            onChange={(e) =>
              setFormState({ ...formState, serverName: e.target.value })
            }
            icon={<Server className="w-4 h-4 text-slate-400" />}
            placeholder="Ex: Hosanna Studio Central"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              Tom Padrão do Sistema
            </label>
            <select
              value={formState.defaultKey}
              onChange={(e) =>
                setFormState({ ...formState, defaultKey: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-m3-primary"
            >
              {[
                "C",
                "C#",
                "D",
                "Eb",
                "E",
                "F",
                "F#",
                "G",
                "Ab",
                "A",
                "Bb",
                "B",
              ].map((k) => (
                <option key={k} value={k}>
                  Tom {k}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Intervalo de Sincronização (segundos)"
            type="number"
            value={formState.syncIntervalSeconds}
            onChange={(e) =>
              setFormState({
                ...formState,
                syncIntervalSeconds: Number(e.target.value),
              })
            }
            icon={<RefreshCw className="w-4 h-4 text-slate-400" />}
            placeholder="30"
          />

          <Input
            label="Tamanho Máximo de Upload por Ficheiro (MB)"
            type="number"
            value={formState.maxUploadMB}
            onChange={(e) =>
              setFormState({
                ...formState,
                maxUploadMB: Number(e.target.value),
              })
            }
            icon={<HardDrive className="w-4 h-4 text-slate-400" />}
            placeholder="50"
          />
        </div>

        <div className="flex items-center justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isUpdating}
            icon={<Save className="w-4 h-4" />}
          >
            Guardar Definições
          </Button>
        </div>
      </div>

      {/* Studio Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-m3-primary" />
          Definições do Studio
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3.5 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <input
              type="checkbox"
              checked={formState.showChordsDefault ?? true}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  showChordsDefault: e.target.checked,
                })
              }
              className="w-4 h-4 text-m3-primary rounded-md focus:ring-m3-primary cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Mostrar Acordes por Defeito ao Visualizar e Editar Cânticos
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Ativa a apresentação automática de acordes sobre a letra no
                visualizador ChordPro e no editor.
              </p>
            </div>
          </label>
        </div>
      </div>
    </form>
  );
};
