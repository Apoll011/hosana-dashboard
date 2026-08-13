/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCan } from "@/src/lib/permissions/client";
import { Can, CanAny } from "@/src/lib/permissions/components";
import { Button, Input, backupApi } from "@hosanna/shared";
import {
  Building2,
  Camera,
  Download,
  ImagePlus,
  Info,
  Loader2,
  Lock,
  PenLine,
  Save,
  ShieldAlert,
  Upload,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { authClient } from "../../lib/authClient";
import { compressImage } from "./settingsUtils";

export interface WorkspaceTabProps {
  active: boolean;
  showToast: (
    text: string,
    variant: "success" | "error" | "info" | "warning",
  ) => void;
  setPendingRestoreData: (data: Record<string, unknown> | null) => void;
  setRestoreStats: (
    stats: { songs: number; folders: number; services: number } | null,
  ) => void;
  setIsTogglingWs: (toggling: boolean) => void;
}

export const WorkspaceTab: React.FC<WorkspaceTabProps> = ({
  active,
  showToast,
  setPendingRestoreData,
  setRestoreStats,
  setIsTogglingWs: _setIsTogglingWs,
}) => {
  const { organization, refetch: refetchAuth } = useAuth();
  const orgMetadata =
    (organization?.metadata as Record<string, unknown> | undefined) || {};

  // --- Refs & Loading States ---
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSavingOrganization, setIsSavingOrganization] = useState(false);

  // --- View States ---
  const [currentName, setCurrentName] = useState(organization?.name || "");
  const [currentLogo, setCurrentLogo] = useState(organization?.logo);
  const [currentDescription, setCurrentDescription] = useState(
    (orgMetadata.description as string) || "",
  );
  const [currentShortName, setCurrentShortName] = useState(
    (orgMetadata.shortName as string) || "",
  );

  // --- Draft States (Edit Mode) ---
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(currentName);
  const [draftLogo, setDraftLogo] = useState(currentLogo);
  const [draftDescription, setDraftDescription] = useState(currentDescription);
  const [draftShortName, setDraftShortName] = useState(currentShortName);

  // --- Permissions ---
  const [canManageOrg, setCanManageOrg] = useState<boolean>(false);
  const { granted, loading: canLoading } = useCan("organization.update");

  useEffect(() => {
    if (!canLoading) {
      setCanManageOrg(granted);
    }
  }, [granted, canLoading]);

  useEffect(() => {
    if (organization) {
      const metadata =
        (organization.metadata as Record<string, unknown> | undefined) || {};
      setCurrentName(organization.name);
      setCurrentLogo(organization.logo);
      setCurrentDescription((metadata.description as string) || "");
      setCurrentShortName((metadata.shortName as string) || "");

      setDraftName(organization.name);
      setDraftLogo(organization.logo);
      setDraftDescription((metadata.description as string) || "");
      setDraftShortName((metadata.shortName as string) || "");
    }
  }, [organization]);

  if (!active) return null;

  // --- Handlers ---
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

  const handleSaveOrganization = async (e?: React.FormEvent) => {
    e?.preventDefault(); // Prevent form submission refresh

    if (!draftName.trim()) {
      showToast("O nome da organização não pode estar vazio.", "error");
      return;
    }

    // Keep previous state in case of rollback
    const previousState = {
      currentName,
      currentLogo,
      currentDescription,
      currentShortName,
    };

    setCurrentName(draftName);
    setCurrentLogo(draftLogo);
    setCurrentDescription(draftDescription);
    setCurrentShortName(draftShortName);
    setIsEditing(false);

    try {
      setIsSavingOrganization(true);
      await authClient.organization.update({
        data: {
          name: draftName,
          logo: draftLogo,
          metadata: {
            ...orgMetadata,
            description: draftDescription.trim() || undefined,
            shortName: draftShortName.trim() || undefined,
          },
        },
      });
      await refetchAuth();
      showToast("Organização atualizada com sucesso!", "success");
    } catch (err) {
      // Rollback on error
      setCurrentName(previousState.currentName);
      setCurrentLogo(previousState.currentLogo);
      setCurrentDescription(previousState.currentDescription);
      setCurrentShortName(previousState.currentShortName);
      setDraftName(previousState.currentName);
      setDraftLogo(previousState.currentLogo);
      setDraftDescription(previousState.currentDescription);
      setDraftShortName(previousState.currentShortName);
      setIsEditing(true);

      showToast(
        "Erro ao atualizar: " +
          ((err as { message?: string })?.message || "Erro de rede"),
        "error",
      );
    } finally {
      setIsSavingOrganization(false);
    }
  };

  const handleCancelEdit = () => {
    setDraftName(currentName);
    setDraftLogo(currentLogo);
    setDraftDescription(currentDescription);
    setDraftShortName(currentShortName);
    setIsEditing(false);
  };

  const handleBackup = async () => {
    setIsDownloading(true);
    try {
      await backupApi.downloadBackup();
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
    <div className="space-y-6 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Workspace Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-m3-primary" />
              Perfil da Organização
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Gira a identidade visual e detalhes da sua igreja.
            </p>
          </div>

          {!canManageOrg && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              Apenas Leitura
            </span>
          )}
        </div>

        {/* Card Body */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Logo Section */}
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="relative group w-28 h-28 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden shadow-inner">
                {/* Active Image */}
                {(isEditing ? draftLogo : currentLogo) ? (
                  <img
                    src={(isEditing ? draftLogo : currentLogo) as string}
                    alt="Logo da Organização"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <ImagePlus className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                )}

                {/* Edit Overlay */}
                {isEditing && canManageOrg && (
                  <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 backdrop-blur-sm">
                    {isCompressing ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-white mb-1" />
                        <span className="text-[11px] font-medium text-white uppercase tracking-wider">
                          Alterar
                        </span>
                      </>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      disabled={isCompressing}
                    />
                  </label>
                )}
              </div>

              {isEditing && canManageOrg && (
                <p className="text-[11px] text-slate-400 text-center max-w-27.5">
                  JPG, PNG ou WebP. <br /> Máx 800x800px.
                </p>
              )}
            </div>

            {/* Details Section */}
            <div className="flex-1 w-full">
              {isEditing ? (
                <form
                  id="org-edit-form"
                  onSubmit={handleSaveOrganization}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Nome da Igreja / Organização"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        placeholder="e.g. Igreja Hosanna Lisboa"
                        required
                        disabled={isSavingOrganization}
                      />
                    </div>
                    <Input
                      label="Nome Abreviado (Sigla)"
                      value={draftShortName}
                      onChange={(e) => setDraftShortName(e.target.value)}
                      placeholder="e.g. IHL"
                      disabled={isSavingOrganization}
                    />
                    <Input
                      label="Descrição"
                      value={draftDescription}
                      onChange={(e) => setDraftDescription(e.target.value)}
                      placeholder="Breve descrição da organização"
                      disabled={isSavingOrganization}
                    />
                  </div>
                </form>
              ) : (
                <div className="pt-1">
                  <div className="flex flex-col space-y-1.5">
                    <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                      {currentName || "Minha Organização"}
                    </h3>

                    {currentShortName && (
                      <span className="text-sm font-semibold text-m3-primary bg-m3-primary/10 w-fit px-2.5 py-0.5 rounded-md">
                        {currentShortName}
                      </span>
                    )}

                    {currentDescription && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-xl leading-relaxed">
                        {currentDescription}
                      </p>
                    )}
                  </div>

                  {/* Tech Specs Box */}
                  <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                        Identificador (ID)
                      </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {organization?.id || "org-default"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                        Slug
                      </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {organization?.slug || "hosanna"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              {canManageOrg && (
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  {isEditing ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isSavingOrganization}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        form="org-edit-form"
                        variant="primary"
                        disabled={isSavingOrganization}
                        icon={
                          isSavingOrganization ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )
                        }
                      >
                        {isSavingOrganization
                          ? "A guardar..."
                          : "Guardar Alterações"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
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
      </div>

      {/* Backup & Data Card */}
      <CanAny permissions={["backup.export", "backup.import"]}>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-sky-500" />
              Cópia de Segurança & Dados
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Exporte ou restaure todos os repertórios, cultos e definições num
              ficheiro JSON seguro.
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Area */}
              <Can permission="backup.export">
                <div className="flex flex-col p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-lg shrink-0">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Exportar Dados
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Transfira um backup completo da sua organização.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-center mt-auto"
                    onClick={handleBackup}
                    disabled={isDownloading}
                    icon={
                      isDownloading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                      ) : (
                        <Download className="w-4 h-4 text-sky-500" />
                      )
                    }
                  >
                    {isDownloading
                      ? "A processar backup..."
                      : "Descarregar JSON"}
                  </Button>
                </div>
              </Can>

              {/* Import Area */}
              <Can permission="backup.import">
                <div className="flex flex-col p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Restaurar Dados
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex gap-1">
                        <Info className="w-3.5 h-3.5 inline shrink-0" />
                        Pode substituir dados existentes. Tenha cuidado.
                      </p>
                    </div>
                  </div>

                  <input
                    ref={restoreInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleRestoreFile}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-center mt-auto"
                    onClick={() => restoreInputRef.current?.click()}
                    icon={<Upload className="w-4 h-4 text-emerald-500" />}
                  >
                    Carregar Ficheiro JSON
                  </Button>
                </div>
              </Can>
            </div>
          </div>
        </div>
      </CanAny>
    </div>
  );
};
