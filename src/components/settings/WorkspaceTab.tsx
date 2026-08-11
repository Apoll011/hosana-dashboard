/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCan } from "@/src/lib/permissions/client";
import { Can, CanAny } from "@/src/lib/permissions/components";
import { Button, Input, settingsApi } from "@hosanna/shared";
import {
  Building2,
  Camera,
  Download,
  Lock,
  PenLine,
  Save,
  Upload,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { authClient } from "../../lib/authClient";
import { compressImage } from "./settingsUtils";

export interface WorkspaceTabProps {
  active: boolean;
  showToast: (text: string, variant: any) => void;
  setPendingRestoreData: (data: any) => void;
  setRestoreStats: (stats: any) => void;
  setIsTogglingWs: (toggling: boolean) => void;
}

export const WorkspaceTab: React.FC<WorkspaceTabProps> = ({
  active,
  showToast,
  setPendingRestoreData,
  setRestoreStats,
  setIsTogglingWs,
}) => {
  const { tenant, user, refetch: refetchAuth } = useAuth();

  const [isDownloading, setIsDownloading] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [currentName, setCurrentName] = useState(tenant?.name || "");
  const [currentLogo, setCurrentLogo] = useState<string | undefined>(
    tenant?.logo,
  );

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(currentName);
  const [draftLogo, setDraftLogo] = useState<string | undefined>(currentLogo);

  const [canManageOrg, setCanManageOrg] = useState<boolean>(false);

  const [isCompressing, setIsCompressing] = useState(false);
  const [isSavingTenant, setIsSavingTenant] = useState(false);

  const { granted, loading: canLoading } = useCan("organization.update");

  useEffect(() => {
    if (!canLoading) {
      setCanManageOrg(granted);
    }
  }, [granted, canLoading]);

  useEffect(() => {
    if (tenant) {
      setCurrentName(tenant.name);
      setCurrentLogo(tenant.logo);
      setDraftName(tenant.name);
      setDraftLogo(tenant.logo);
    }
  }, [tenant]);

  if (!active) return null;

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Por favor selecione um ficheiro de imagem válido.", "error");
      return;
    }

    try {
      setIsCompressing(true);
      const compressedBase64 = await compressImage(file, 800, 0.8);
      setDraftLogo(compressedBase64);
    } catch {
      showToast("Erro ao processar a imagem. Tente novamente.", "error");
    } finally {
      setIsCompressing(false);
      e.target.value = "";
    }
  };

  const handleSaveTenant = async () => {
    if (!draftName.trim()) {
      showToast("O nome do workspace não pode estar vazio.", "error");
      return;
    }

    const previousName = currentName;
    const previousLogo = currentLogo;

    setCurrentName(draftName);
    setCurrentLogo(draftLogo);
    setIsEditing(false);

    try {
      setIsSavingTenant(true);
      await authClient.organization.update({
        data: {
          name: draftName,
          logo: draftLogo,
        },
      });
      await refetchAuth();
      showToast("Organização atualizada com sucesso!", "success");
    } catch (err: any) {
      setCurrentName(previousName);
      setCurrentLogo(previousLogo);
      setDraftName(previousName);
      setDraftLogo(previousLogo);
      setIsEditing(true);
      showToast(
        "Erro ao atualizar: " + (err?.message || "Erro de rede"),
        "error",
      );
    } finally {
      setIsSavingTenant(false);
    }
  };

  const handleBackup = async () => {
    setIsDownloading(true);
    try {
      const data = await settingsApi.downloadBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hosanna-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Cópia de segurança descarregada com sucesso!", "success");
    } catch {
      showToast("Falha ao exportar cópia de segurança.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setPendingRestoreData(json);
        setRestoreStats({
          songs: json.songs?.length || 0,
          services: json.services?.length || 0,
          folders: json.folders?.length || 0,
        });
      } catch {
        showToast("Ficheiro JSON de cópia de segurança inválido.", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Workspace Identity Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-m3-primary" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Perfil da Organização
            </h2>
          </div>

          {!canManageOrg && (
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              Apenas Leitura
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden">
              {(isEditing ? draftLogo : currentLogo) ? (
                <img
                  src={(isEditing ? draftLogo : currentLogo) as string}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-8 h-8 text-slate-400" />
              )}
            </div>

            {isEditing && canManageOrg && (
              <>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 bg-m3-primary text-white rounded-lg shadow-md hover:bg-m3-primary/90 transition-colors cursor-pointer"
                  title="Carregar Logótipo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          <div className="flex-1 w-full space-y-3">
            {isEditing ? (
              <Input
                label="Nome da Organização"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="e.g. Igreja Hosanna Lisboa"
              />
            ) : (
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  {currentName || "Minha Organização"}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {tenant?.id || "org-default"} · Slug:{" "}
                  {tenant?.slug || "hosanna"}
                </p>
              </div>
            )}

            {canManageOrg && (
              <div className="flex gap-2 pt-1">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveTenant}
                      disabled={isSavingTenant}
                      icon={<Save className="w-4 h-4" />}
                    >
                      Guardar Alterações
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    icon={<PenLine className="w-4 h-4" />}
                  >
                    Editar Organização
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <CanAny permissions={["export.backup", "import.backup"]}>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Download className="w-4 h-4 text-m3-primary" />
              Cópia de Segurança & Dados
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Exporte ou restaure todos os repertórios, cultos e definições da
              organização.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Can permission="export.backup">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackup}
                disabled={isDownloading}
                icon={<Download className="w-4 h-4 text-sky-500" />}
              >
                {isDownloading
                  ? "A descarregar..."
                  : "Exportar Cópia de Segurança"}
              </Button>
            </Can>

            <Can permission="import.backup">
              <input
                ref={restoreInputRef}
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => restoreInputRef.current?.click()}
                icon={<Upload className="w-4 h-4 text-emerald-500" />}
              >
                Restaurar Dados
              </Button>
            </Can>
          </div>
        </div>
      </CanAny>
    </div>
  );
};
