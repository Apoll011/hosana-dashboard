/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AdminUser,
  authApi,
  Button,
  ConfirmDialog,
  Input,
  Modal,
  ServerSettings,
  settingsApi,
  Spinner,
} from "@hosanna/shared";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  Building,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Church,
  Clock,
  Database,
  Download,
  FileText,
  FileUp,
  Fingerprint,
  Github,
  HardDrive,
  Heart,
  Info,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MonitorSmartphone,
  Moon,
  Palette,
  PenLine,
  RefreshCw,
  RotateCcw,
  Save,
  Scale,
  Server,
  Shield,
  ShieldAlert,
  Sun,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ToastMessage, useSync } from "../contexts/SyncContext";
import { useTheme } from "../contexts/ThemeContext";
import { useAdmins } from "../hooks/useAdmins";
import { useSettings } from "../hooks/useSettings";
import { songImportRegistry } from "../import";

const GeneralTab: React.FC<{ active: boolean }> = ({ active }) => {
  const { settingsQuery, updateSettings, isUpdating } = useSettings();

  useEffect(() => {
    if (settingsQuery.data) {
      setFormState((prev) => ({ ...prev, ...settingsQuery.data }));
    }
  }, [settingsQuery.data]);

  // Server Settings Form state
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

  if (!active) return;

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
    <form onSubmit={handleSubmitSettings} className="space-y-6">
      {/* Server Configuration Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-[#0284c7]" />
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
            placeholder="Ex: Hosana Studio Central"
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
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
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
            label="Intervalo de Sincronização (Segundos)"
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
            label="Limite Máximo de Upload por Ficheiro (MB)"
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

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#0284c7]" />
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
              className="w-4 h-4 text-[#0284c7] rounded-md focus:ring-[#0284c7] cursor-pointer"
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

interface WorkspaceTabProps {
  active: boolean;
  showToast: (text: string, variant: ToastMessage["type"]) => void;
  setPendingRestoreData: (data: any) => void;
  setIsTogglingWs: (active: boolean) => void;
  setRestoreStats: (data: {
    songs: number;
    folders: number;
    services: number;
  }) => void;
}

const compressImage = (
  file: File,
  maxWidth = 800,
  quality = 0.8,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Exportar como JPEG para melhor rácio de compressão vs compatibilidade
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const WorkspaceTab: React.FC<WorkspaceTabProps> = ({
  active,
  showToast,
  setPendingRestoreData,
  setRestoreStats,
  setIsTogglingWs,
}) => {
  const { tenant } = useAuth();

  const [isDownloading, setIsDownloading] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Estados de Exibição (Fonte da verdade para a UI)
  const [currentName, setCurrentName] = useState(tenant?.name || "");
  const [currentLogo, setCurrentLogo] = useState<string | undefined>(
    tenant?.logo,
  );

  // Estados do Formulário (Rascunho enquanto edita)
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(currentName);
  const [draftLogo, setDraftLogo] = useState<string | undefined>(currentLogo);

  const [isCompressing, setIsCompressing] = useState(false);
  const [isSavingTenant, setIsSavingTenant] = useState(false);

  // Atualizar a UI se o tenant mudar externamente
  useEffect(() => {
    if (tenant) {
      setCurrentName(tenant.name);
      setCurrentLogo(tenant.logo);
      setDraftName(tenant.name);
      setDraftLogo(tenant.logo);
    }
  }, [tenant]);

  const getWorkspaceInitials = (name: string) => {
    if (!name) return "W";
    return name
      .split(" ")
      .map((w) => w.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Por favor selecione um ficheiro de imagem válido.", "error");
      return;
    }

    try {
      setIsCompressing(true);
      // Comprimir a imagem (Max 800px, 80% qualidade)
      const compressedBase64 = await compressImage(file, 800, 0.8);
      setDraftLogo(compressedBase64);
    } catch (error) {
      showToast("Erro ao processar e comprimir a imagem.", "error");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleStartEdit = () => {
    setDraftName(currentName);
    setDraftLogo(currentLogo);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setDraftName(currentName);
    setDraftLogo(currentLogo);
    setIsEditing(false);
  };

  const handleSaveTenant = async () => {
    if (!draftName.trim()) {
      showToast("O nome do workspace não pode estar vazio.", "error");
      return;
    }

    // Guardar estado antigo para caso de falha (Rollback)
    const previousName = currentName;
    const previousLogo = currentLogo;

    // 1. Atualização Otimista (Optimistic Update)
    setCurrentName(draftName);
    setCurrentLogo(draftLogo);
    setIsEditing(false);

    try {
      setIsSavingTenant(true);
      const logo = draftLogo;
      await authApi.editTenant({
        name: draftName,
        logo,
      });
      showToast("Workspace atualizado com sucesso!", "success");
    } catch (err: any) {
      // 2. Reverter (Rollback) em caso de erro
      setCurrentName(previousName);
      setCurrentLogo(previousLogo);
      setDraftName(previousName);
      setDraftLogo(previousLogo);
      setIsEditing(true); // Reabre o formulário para o utilizador tentar de novo

      showToast(
        "Erro ao atualizar: " + (err?.message || "Falha de comunicação"),
        "error",
      );
    } finally {
      setIsSavingTenant(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      setIsDownloading(true);
      const data = await settingsApi.downloadBackup();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `hosanna-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast("Cópia de segurança descarregada com sucesso!", "success");
    } catch (err: any) {
      showToast("Erro ao descarregar cópia de segurança.", "error");
    } finally {
      setIsDownloading(false);
    }
  };
  // 2. Reverter (Rollback) em caso de erro

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || typeof parsed !== "object") {
          throw new Error("Formato de ficheiro inválido.");
        }

        setPendingRestoreData(parsed);
        setRestoreStats({
          songs: Array.isArray(parsed.songs) ? parsed.songs.length : 0,
          folders: Array.isArray(parsed.folders) ? parsed.folders.length : 0,
          services: Array.isArray(parsed.services) ? parsed.services.length : 0,
        });
      } catch (err: any) {
        showToast(
          "Ficheiro de cópia de segurança inválido: " + err.message,
          "error",
        );
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (!active) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      {/* 1. Secção: Workspace Profile */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-all">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-sky-500" />
            Perfil do Workspace
          </h3>

          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartEdit}
              icon={<PenLine className="w-3.5 h-3.5" />}
            >
              Editar Perfil
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center mt-6">
          {/* Logo / Avatar (Com suporte a loading state durante a compressão) */}
          <div
            className={`relative group shrink-0 w-24 h-24 rounded-full overflow-hidden border shadow-sm transition-all duration-300
              ${isEditing ? "border-sky-400 ring-4 ring-sky-500/10" : "border-slate-200 dark:border-slate-700"}
            `}
          >
            <input
              type="file"
              ref={logoInputRef}
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
              disabled={!isEditing || isCompressing}
            />

            {(isEditing ? draftLogo : currentLogo) ? (
              <img
                src={isEditing ? draftLogo : currentLogo}
                alt={isEditing ? draftName : currentName}
                className={`w-full h-full object-cover transition-opacity ${isCompressing ? "opacity-50" : "opacity-100"}`}
              />
            ) : (
              <div className="w-full h-full bg-linear-to-tr from-[#0284c7] to-sky-400 flex items-center justify-center text-white font-black text-3xl">
                {getWorkspaceInitials(
                  (isEditing ? draftName : currentName) || "",
                )}
              </div>
            )}

            {isEditing && (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={isCompressing}
                className={`absolute inset-0 bg-slate-900/50 text-white flex items-center justify-center backdrop-blur-[2px] cursor-pointer transition-opacity duration-200
                  ${isCompressing ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                `}
              >
                {isCompressing ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Camera className="w-7 h-7 mb-1" />
                )}
              </button>
            )}
          </div>

          {/* Campos / Display */}
          <div className="flex-1 w-full space-y-3">
            {isEditing ? (
              <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Nome do Workspace
                </label>
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Ex: Minha Igreja"
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm"
                  autoFocus
                />
              </div>
            ) : (
              <div className="space-y-1 py-2 animate-in fade-in duration-300">
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {currentName || "Workspace sem nome"}
                </h4>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-mono rounded-md">
                  <span>/</span>
                  {tenant?.slug || "sem-slug"}
                </div>
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-3 pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelEdit}
              disabled={isSavingTenant || isCompressing}
              icon={<X className="w-4 h-4" />}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveTenant}
              isLoading={isSavingTenant}
              disabled={isCompressing}
              icon={<Save className="w-4 h-4" />}
            >
              Guardar Alterações
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-slate-400" />
          Detalhes do Workspace
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <Fingerprint className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                ID do Tenant
              </span>
            </div>
            <p className="text-sm font-mono text-slate-900 dark:text-slate-200">
              {tenant?.id || "N/A..."}
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Permissões
              </span>
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
              Administrador
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Estado
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full ${tenant?.active ? "bg-emerald-400" : "bg-red-400"} opacity-75`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${tenant?.active ? "bg-emerald-500" : "bg-red-500"}`}
                ></span>
              </span>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                {tenant?.active ? "Ativo" : "Desativo"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-500" />
            Gestão de Dados & Backups
          </h3>
          <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
            Local JSON
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Export */}
          <div className="group p-6 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-800 hover:bg-sky-50/30 dark:hover:bg-sky-950/20 rounded-2xl flex flex-col justify-between gap-5 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-sky-100 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800/60 text-[#0284c7] dark:text-sky-400 rounded-xl shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Exportar Backup
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Descarrega a base de dados atual num ficheiro JSON.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadBackup}
              isLoading={isDownloading}
              icon={<Download className="w-4 h-4" />}
              className="w-full justify-center"
            >
              Transferir Cópia
            </Button>
          </div>

          {/* Import */}
          <div className="group p-6 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800/60 hover:bg-amber-50/30 dark:hover:bg-amber-950/10 rounded-2xl flex flex-col justify-between gap-5 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Restaurar Dados
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Carrega um ficheiro .json previamente guardado para recuperar
                  os teus dados.
                </p>
              </div>
            </div>
            <input
              type="file"
              ref={restoreInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => restoreInputRef.current?.click()}
              icon={<RotateCcw className="w-4 h-4 text-amber-500" />}
              className="w-full justify-center hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              Carregar Ficheiro
            </Button>
          </div>
        </div>
      </div>

      <div className="border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            {tenant?.active ? "Desativar" : "Ativar"} Workspace
          </h3>
          <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
            Apagar permanentemente este workspace e todos os seus dados. Esta
            ação não pode ser desfeita.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsTogglingWs(true)}
          className="shrink-0 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 text-sm font-semibold rounded-lg transition-colors border border-red-200 dark:border-red-800"
        >
          {tenant?.active ? "Desativar" : "Ativar"} Workspace
        </button>
      </div>
    </div>
  );
};

const AccountTab: React.FC<{ active: boolean }> = ({ active }) => {
  const { tenant } = useAuth();

  if (!active) return;

  return <h1>{tenant?.name}</h1>;
};

const MembersTab: React.FC<{
  active: boolean;
  setAdminToRemove: (admin: AdminUser) => void;
  setIsInviteModalOpen: (active: boolean) => void;
}> = ({ active, setAdminToRemove, setIsInviteModalOpen }) => {
  const { user: currentUser } = useAuth();

  const { admins, pendingAdmins, approveAdmin, adminsQuery, isApproving } =
    useAdmins();

  const handleApproveUser = async (adminId: string) => {
    try {
      await approveAdmin(adminId);
    } catch {
      // Error handled by mutation
    }
  };

  const pendingCount = pendingAdmins.length;

  if (!active) return;

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0284c7]" />
            Gestão de Membros
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gira os membros e aprove contas pendentes
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats badges */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#0284c7]" />
              {admins.length} Membro(s)
            </span>

            {pendingCount > 0 && (
              <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-extrabold flex items-center gap-1.5 animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                {pendingCount} Pendente{pendingCount > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Invite Administrator Button */}
          <Button
            variant="primary"
            size="sm"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsInviteModalOpen(true)}
          >
            Convidar Membro
          </Button>
        </div>
      </div>

      {/* Pending Approval Section Alert if any */}
      {pendingCount > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <span>
              Existem <strong>{pendingCount}</strong> conta(s) a aguardar
              aprovação por um administrador da organização.
            </span>
          </div>
        </div>
      )}

      {/* Table of Admins */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {adminsQuery.isLoading ? (
          <div className="p-12 text-center">
            <Spinner label="A carregar administradores..." />
          </div>
        ) : admins.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            Nenhum administrador encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4 sm:px-6">Nome & E-mail</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Data de Registo</th>
                  <th className="py-3.5 px-4 text-right sm:pr-6">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {admins.map((admin) => {
                  const isSelf = currentUser?.id === admin.id;
                  const isApproved = admin.isApproved;

                  return (
                    <tr
                      key={admin.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Email */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-linear-to-tr from-[#0284c7] to-sky-400 flex items-center justify-center text-white font-extrabold text-xs shadow-sm shrink-0">
                            {admin.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                              {admin.name}
                              {isSelf && (
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#0284c7] bg-sky-50 dark:bg-sky-950 px-1.5 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                                  Você
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {admin.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Aprovado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            Aprovação Pendente
                          </span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-medium">
                        {admin.createdAt
                          ? new Date(admin.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right sm:pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {!isApproved && (
                            <Button
                              variant="primary"
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                              isLoading={isApproving}
                              icon={<Check className="w-3.5 h-3.5" />}
                              onClick={() => handleApproveUser(admin.id)}
                            >
                              Aprovar
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            title={
                              isSelf
                                ? "Apagar a sua própria conta"
                                : "Apagar conta do utilizador"
                            }
                            className="text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900/50 dark:hover:bg-rose-950/50"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            onClick={() => setAdminToRemove(admin)}
                          >
                            Apagar Conta
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const AppearanceTab: React.FC<{ active: boolean }> = ({ active }) => {
  const { theme, setTheme } = useTheme();

  if (!active) return null;

  const themes = [
    {
      id: "light",
      title: "Modo Claro",
      description: "Ideal para ambientes bem iluminados.",
      icon: Sun,
      iconClass: "bg-amber-100 text-amber-600",
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
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Aparência
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Escolha como pretende visualizar a aplicação.
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
                      ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30 ring-2 ring-sky-500/20 shadow-md"
                      : "border-slate-200 dark:border-slate-800 hover:border-sky-300 hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  {selected && (
                    <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-sky-500 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`mb-4 inline-flex rounded-2xl p-3 ${item.iconClass}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
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
const AboutTab: React.FC<{ active: boolean }> = ({ active }) => {
  const { tenant } = useAuth();
  const [showLicenses, setShowLicenses] = useState(false);

  if (!active) return null;

  const productionDependencies = [
    { name: "React & React DOM (v19)", license: "MIT", type: "UI Framework" },
    {
      name: "@tanstack/react-query",
      license: "MIT",
      type: "State & Data Fetching",
    },
    { name: "@dnd-kit (Core/Sortable)", license: "MIT", type: "Drag and Drop" },
    { name: "Motion (Framer Motion)", license: "MIT", type: "Animações" },
    { name: "@tailwindcss/vite", license: "MIT", type: "Estilização" },
    { name: "Lucide React", license: "ISC", type: "Ícones" },
    { name: "React Router Dom", license: "MIT", type: "Navegação" },
    { name: "@google/genai", license: "Apache-2.0", type: "Integração AI" },
    {
      name: "Zod & React Hook Form",
      license: "MIT",
      type: "Formulários & Validação",
    },
    { name: "Free Use Bible API", license: "MIT", type: "Integração Bíblica" },
    { name: "Kbar", license: "MIT", type: "Menu de Comandos (Ctrl+K)" },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-sky-50 dark:bg-sky-950/50 rounded-xl shrink-0">
              <Info className="w-6 h-6 text-[#0284c7]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Sobre o Hosanna
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Painel de Controlo {tenant?.name ? `• ${tenant.name}` : ""}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                © {new Date().getFullYear()} Tiago Inês. Código sob licença MIT.
              </p>
            </div>
          </div>
          <div className="sm:text-right shrink-0 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl self-start sm:self-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
              Versão do Studio
            </span>
            <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
              {APP_VERSION}
            </span>
          </div>
        </div>

        {/* Banner de Orgulho Open Source */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl gap-3">
          <div className="flex items-center gap-2.5">
            <Heart className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 fill-emerald-500/20" />
            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              Este projeto é <strong>open-source</strong>! Acreditamos no
              software livre para equipar e apoiar comunidades globalmente.
            </p>
          </div>
          <a
            href="https://github.com/Apoll011/Hosana-dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-700/55 transition-colors shrink-0"
          >
            <Github className="w-3.5 h-3.5" />
            Ver Repositório
          </a>
        </div>
      </div>

      {/* 2. FORMATOS DE IMPORTAÇÃO */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <FileUp className="w-4 h-4 text-[#0284c7]" />
          Formatos de Importação Suportados
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          O sistema suporta a importação automática de cânticos a partir dos
          seguintes ficheiros e integrações registadas:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {songImportRegistry.getProviders().map((provider) => (
            <div
              key={provider.id}
              className="flex flex-col justify-between p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700 transition-colors space-y-2.5"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#0284c7]" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {provider.name}
                  </span>
                </div>
                {provider.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {provider.description}
                  </p>
                )}
              </div>

              {provider.supportedExtensions.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[10px] uppercase font-medium text-slate-400 dark:text-slate-500">
                    Extensões:
                  </span>
                  {provider.supportedExtensions.map((ext) => (
                    <span
                      key={ext}
                      className="px-2 py-0.5 text-[10px] font-mono font-medium bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-300/50 dark:border-slate-700/50"
                    >
                      .{ext.replace(/^\./, "")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. DOCUMENTOS LEGAIS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#0284c7]" />
          Documentação Legal e Termos
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ao utilizar a plataforma Hosanna Studio, concorda com as políticas de
          termos de licença MIT e integridade de dados locais.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <a
            href="/legal/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 group transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Scale className="w-4 h-4 text-slate-400 group-hover:text-[#0284c7] transition-colors" />
              <div className="text-left">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  Termos de Serviço
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  Uso do serviço e licença open-source
                </span>
              </div>
            </div>
          </a>

          <a
            href="/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 group transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-slate-400 group-hover:text-[#0284c7] transition-colors" />
              <div className="text-left">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  Política de Privacidade
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  Privacidade local e telemetria opcional
                </span>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* 4. LICENÇAS DE TERCEIROS (Dinâmico com o package.json de produção) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <button
          onClick={() => setShowLicenses(!showLicenses)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors focus:outline-hidden"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0284c7]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Dependências e Licenças do Ecossistema
            </h3>
          </div>
          {showLicenses ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showLicenses && (
          <div className="px-6 pb-6 border-t border-slate-100 dark:border-slate-800 pt-4 bg-slate-50/30 dark:bg-slate-900/50 space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              O ecossistema Hosanna Studio assenta sobre bases robustas da
              comunidade open-source. Abaixo encontram-se listados os módulos de
              produção registados:
            </p>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {productionDependencies.map((lib) => (
                <div
                  key={lib.name}
                  className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block sm:inline mr-2">
                      {lib.name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {lib.type}
                    </span>
                  </div>
                  <span className="inline-self-start sm:inline-self-auto px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-sm">
                    {lib.license}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
interface SettingsPageProps {
  hideHeader?: boolean;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ hideHeader }) => {
  const queryClient = useQueryClient();
  const { showToast } = useSync();
  const { user: currentUser, logout, tenant } = useAuth();

  // Navigation tab inside Settings page
  const [activeTab, setActiveTab] = useState<
    "general" | "workspace" | "account" | "members" | "apperance" | "about"
  >("general");

  // Admins Hook
  const { pendingAdmins, createAdmin, removeAdmin, isCreating, isRemoving } =
    useAdmins();

  // Invite Admin Modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");

  // Delete Admin Confirmation Modal state
  const [adminToRemove, setAdminToRemove] = useState<AdminUser | null>(null);

  const [isRestoring, setIsRestoring] = useState(false);
  const [isTogglingWs, setIsTogglingWs] = useState(false);

  const [pendingRestoreData, setPendingRestoreData] = useState<any | null>(
    null,
  );
  const [restoreStats, setRestoreStats] = useState<{
    songs: number;
    folders: number;
    services: number;
  } | null>(null);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !invitePassword.trim() || !inviteName.trim()) {
      showToast("Por favor preencha todos os campos obrigatórios.", "error");
      return;
    }

    try {
      await createAdmin({
        email: inviteEmail.trim(),
        password: invitePassword,
        name: inviteName.trim(),
        role: "admin",
      });
      setIsInviteModalOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInvitePassword("");
      setInviteRole("admin");
    } catch {
      // Error handled by mutation
    }
  };

  const handleConfirmRemove = async () => {
    if (!adminToRemove) return;
    const isRemovingSelf = currentUser?.id === adminToRemove.id;

    try {
      await removeAdmin(adminToRemove.id);
      setAdminToRemove(null);

      if (isRemovingSelf) {
        showToast("A sua conta foi eliminada. A terminar sessão...", "success");
        await logout();
      }
    } catch {
      // Error handled by mutation
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestoreData) return;

    try {
      setIsRestoring(true);
      const res = await settingsApi.restoreBackup(pendingRestoreData);
      await queryClient.invalidateQueries();

      showToast(
        `Cópia de segurança restaurada com sucesso! (${res.counts?.songs || 0} cânticos, ${res.counts?.folders || 0} pastas, ${res.counts?.services || 0} cultos)`,
        "success",
      );
      setPendingRestoreData(null);
      setRestoreStats(null);
    } catch (err: any) {
      showToast(
        "Erro ao restaurar cópia de segurança: " +
          (err?.message || "Falha ao processar"),
        "error",
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const handlerToggleWorkspaceState = async () => {
    setIsTogglingWs(false);
    await authApi.editTenant({
      active: !tenant?.active,
    });
    showToast(
      `${tenant?.name} agora está ${!tenant?.active ? "Ativo" : "Desativo"}`,
      "info",
    );
  };

  const pendingCount = pendingAdmins.length;

  return (
    <div
      className={`flex-1 flex flex-col w-full mx-auto space-y-6 overflow-y-auto h-full ${hideHeader ? "p-6" : "p-4 sm:p-6 max-w-5xl"}`}
    >
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto *:shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "general"
              ? "bg-[#0284c7] text-white shadow-md shadow-[#0284c7]/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Geral e Servidor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("workspace")}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "workspace"
              ? "bg-[#0284c7] text-white shadow-md shadow-[#0284c7]/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          }`}
        >
          <Church className="w-4 h-4" />
          <span>Igreja</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("account")}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "account"
              ? "bg-[#0284c7] text-white shadow-md shadow-[#0284c7]/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Conta Pessoal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer relative ${
            activeTab === "members"
              ? "bg-[#0284c7] text-white shadow-md shadow-[#0284c7]/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Membros da Igreja</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("apperance")}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "apperance"
              ? "bg-[#0284c7] text-white shadow-md shadow-[#0284c7]/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Aparencia</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("about")}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "about"
              ? "bg-[#0284c7] text-white shadow-md shadow-[#0284c7]/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Sobre Hosanna</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <GeneralTab active={activeTab === "general"} />
        <WorkspaceTab
          active={activeTab === "workspace"}
          setPendingRestoreData={setPendingRestoreData}
          setRestoreStats={setRestoreStats}
          showToast={showToast}
          setIsTogglingWs={setIsTogglingWs}
        />
        <AccountTab active={activeTab === "account"} />
        <MembersTab
          active={activeTab === "members"}
          setAdminToRemove={setAdminToRemove}
          setIsInviteModalOpen={setIsInviteModalOpen}
        />
        <AppearanceTab active={activeTab === "apperance"} />
        <AboutTab active={activeTab === "about"} />
      </div>

      {/* ==================== MODAL: INVITE ADMINISTRATOR ==================== */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Convidar Novo Administrador"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <Input
            label="Nome Completo"
            placeholder="Ex: Carlos Eduardo"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            icon={<User className="w-4 h-4 text-slate-400" />}
          />

          <Input
            type="email"
            label="E-mail do Administrador"
            placeholder="carlos@hosana.org"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            icon={<Mail className="w-4 h-4 text-slate-400" />}
          />

          <Input
            type="password"
            label="Palavra-passe Inicial"
            placeholder="••••••••"
            value={invitePassword}
            onChange={(e) => setInvitePassword(e.target.value)}
            icon={<Lock className="w-4 h-4 text-slate-400" />}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isCreating}
              icon={<UserPlus className="w-4 h-4" />}
            >
              Adicionar Administrador
            </Button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODAL: CONFIRM REMOVE ADMIN ==================== */}
      <Modal
        isOpen={Boolean(adminToRemove)}
        onClose={() => setAdminToRemove(null)}
        title="Eliminar Conta de Administrador"
      >
        <div className="flex flex-col gap-4">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-3 text-xs text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <strong className="font-bold">Atenção ao Eliminar Conta:</strong>
              <p className="mt-0.5">
                Tem a certeza que deseja eliminar permanentemente a conta de{" "}
                <strong>{adminToRemove?.name}</strong> ({adminToRemove?.email})?
                Esta ação revogará imediatamente todos os privilégios de acesso
                e removerá esta conta da organização.
                {currentUser?.id === adminToRemove?.id && (
                  <>
                    {" "}
                    Como esta é a sua própria conta, a sua sessão será terminada
                    após a eliminação.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdminToRemove(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isRemoving}
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleConfirmRemove}
            >
              Eliminar Conta
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal for Restore */}
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
                Esta ação irá substituir a totalidade dos dados existentes na
                base de dados e API pelos dados contidos no ficheiro de cópia de
                segurança.
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
                  <span className="block text-lg font-extrabold text-[#0284c7]">
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

      <ConfirmDialog
        isOpen={isTogglingWs}
        onConfirm={handlerToggleWorkspaceState}
        onClose={() => setIsTogglingWs(false)}
        title={`${tenant?.active ? "Desativar" : "Ativar"} Workspace`}
        message={
          tenant?.active
            ? "Vais perder accesso a ferramentas de edição de musica e cultos, sendo ainda possivel visualizar todos os conteudos."
            : "Reativar a Igreja"
        }
      />
    </div>
  );
};
