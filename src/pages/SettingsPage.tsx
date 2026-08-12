/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Modal, settingsApi } from "@hosanna/shared";
import {
  AlertTriangle,
  Building2,
  Info,
  Palette,
  RotateCcw,
  Server,
  User,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import { useSync } from "../contexts/SyncContext";

import { AboutTab } from "../components/settings/AboutTab";
import { AccountTab } from "../components/settings/AccountTab";
import { AppearanceTab } from "../components/settings/AppearanceTab";
import { GeneralTab } from "../components/settings/GeneralTab";
import { MembersTab } from "../components/settings/MembersTab";
import { WorkspaceTab } from "../components/settings/WorkspaceTab";

type TabType =
  "general" | "workspace" | "account" | "members" | "appearance" | "about";

export const SettingsPage: React.FC = () => {
  const { showToast } = useSync();

  const [activeTab, setActiveTab] = useState<TabType>("account");

  // Restore Modal State
  const [pendingRestoreData, setPendingRestoreData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [restoreStats, setRestoreStats] = useState<{
    songs: number;
    folders: number;
    services: number;
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Toggle Workspace State
  const [_isTogglingWs, setIsTogglingWs] = useState(false);

  const handleConfirmRestore = async () => {
    if (!pendingRestoreData) return;
    setIsRestoring(true);
    try {
      await settingsApi.restoreBackup(pendingRestoreData);
      showToast(
        "Base de dados restaurada com sucesso! A recarregar...",
        "success",
      );
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch {
      showToast("Falha ao restaurar base de dados.", "error");
    } finally {
      setIsRestoring(false);
      setPendingRestoreData(null);
      setRestoreStats(null);
    }
  };

  const tabs = [
    { id: "account", label: "Conta & Segurança", icon: User },
    { id: "workspace", label: "Organização", icon: Building2 },
    { id: "members", label: "Membros", icon: Users },
    { id: "general", label: "Servidor & Geral", icon: Server },
    { id: "appearance", label: "Aparência", icon: Palette },
    { id: "about", label: "Sobre", icon: Info },
  ];

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-m3-primary text-white shadow-md shadow-m3-primary/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Active Tab Content */}
        <div className="pt-2 pb-12">
          <AccountTab active={activeTab === "account"} />
          <WorkspaceTab
            active={activeTab === "workspace"}
            showToast={showToast}
            setPendingRestoreData={setPendingRestoreData}
            setRestoreStats={setRestoreStats}
            setIsTogglingWs={setIsTogglingWs}
          />
          <MembersTab active={activeTab === "members"} />
          <GeneralTab active={activeTab === "general"} />
          <AppearanceTab active={activeTab === "appearance"} />
          <AboutTab active={activeTab === "about"} />
        </div>
      </div>

      {/* Restore Database Modal */}
      {pendingRestoreData && (
        <Modal
          isOpen={Boolean(pendingRestoreData)}
          onClose={() => {
            setPendingRestoreData(null);
            setRestoreStats(null);
          }}
          title="Confirmar Restauração da Base de Dados"
        >
          <div className="flex flex-col gap-4">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <strong className="font-bold">Atenção ao Restaurar:</strong>
                <p className="mt-0.5">
                  Esta ação irá substituir a totalidade dos dados existentes
                  pelos dados contidos no ficheiro de cópia de segurança
                  selecionado.
                </p>
              </div>
            </div>

            {restoreStats && (
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  Resumo do Conteúdo a Restaurar:
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="block text-lg font-extrabold text-m3-primary">
                      {restoreStats.songs}
                    </span>
                    <span className="text-[10px] text-slate-500">Cânticos</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="block text-lg font-extrabold text-amber-500">
                      {restoreStats.folders}
                    </span>
                    <span className="text-[10px] text-slate-500">Pastas</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="block text-lg font-extrabold text-emerald-500">
                      {restoreStats.services}
                    </span>
                    <span className="text-[10px] text-slate-500">Cultos</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPendingRestoreData(null);
                  setRestoreStats(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isRestoring}
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={handleConfirmRestore}
              >
                Restaurar Base de Dados Agora
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
