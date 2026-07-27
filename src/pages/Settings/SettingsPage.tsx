/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSettings } from '../../hooks/useSettings';
import { useAdmins } from '../../hooks/useAdmins';
import { useAuth } from '../../contexts/AuthContext';
import { useSync } from '../../contexts/SyncContext';
import { useTheme } from '../../contexts/ThemeContext';
import { settingsApi } from '../../api/settings';
import { ServerSettings, AdminUser } from '../../types';
import {
  Settings, Shield, Save, Server, Download, Upload,
  Database, AlertTriangle, RotateCcw,
  Globe, HardDrive, KeyRound, RefreshCw, Sun, Moon, Palette,
  Users, UserPlus, CheckCircle2, Clock, Trash2, Check, UserCheck, Mail, Lock, User
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';

interface SettingsPageProps {
  hideHeader?: boolean;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ hideHeader }) => {
  const queryClient = useQueryClient();
  const { showToast } = useSync();
  const { user: currentUser } = useAuth();
  const context = useOutletContext<any>() || {};
  const actualHideHeader = hideHeader ?? context.hideHeader;
  const { darkMode, toggleDarkMode } = useTheme();
  const { settingsQuery, updateSettings, isUpdating } = useSettings();

  // Navigation tab inside Settings page
  const [activeTab, setActiveTab] = useState<'general' | 'admins' | 'backup'>('general');

  // Admins Hook
  const {
    admins,
    pendingAdmins,
    createAdmin,
    approveAdmin,
    removeAdmin,
    adminsQuery,
    isCreating,
    isApproving,
    isRemoving,
  } = useAdmins();

  // Invite Admin Modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState('admin');

  // Delete Admin Confirmation Modal state
  const [adminToRemove, setAdminToRemove] = useState<AdminUser | null>(null);

  // Server Settings Form state
  const [formState, setFormState] = useState<ServerSettings>({
    id: '',
    serverName: 'Hosanna Studio Server',
    defaultKey: 'G',
    syncIntervalSeconds: 30,
    allowPublicRead: false,
    autoBackupEnabled: true,
    maxUploadMB: 50,
    updatedAt: '',
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<any | null>(null);
  const [restoreStats, setRestoreStats] = useState<{ songs: number; folders: number; services: number } | null>(null);

  const restoreInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settingsQuery.data) {
      setFormState(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const handleSubmitSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formState);
    showToast('Definições do servidor guardadas com sucesso!', 'success');
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !invitePassword.trim() || !inviteName.trim()) {
      showToast('Por favor preencha todos os campos obrigatórios.', 'error');
      return;
    }

    try {
      await createAdmin({
        email: inviteEmail.trim(),
        password: invitePassword,
        name: inviteName.trim(),
        role: inviteRole,
      });
      setIsInviteModalOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInvitePassword('');
      setInviteRole('admin');
    } catch {
      // Error handled by mutation
    }
  };

  const handleApproveUser = async (adminId: string) => {
    try {
      await approveAdmin(adminId);
    } catch {
      // Error handled by mutation
    }
  };

  const handleConfirmRemove = async () => {
    if (!adminToRemove) return;
    try {
      await removeAdmin(adminToRemove.id);
      setAdminToRemove(null);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDownloadBackup = async () => {
    try {
      setIsDownloading(true);
      const data = await settingsApi.downloadBackup();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `hosanna-studio-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Cópia de segurança descarregada com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro ao descarregar cópia de segurança: ' + (err?.message || 'Falha de comunicação'), 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Formato de ficheiro inválido.');
        }

        const songCount = Array.isArray(parsed.songs) ? parsed.songs.length : 0;
        const folderCount = Array.isArray(parsed.folders) ? parsed.folders.length : 0;
        const serviceCount = Array.isArray(parsed.services) ? parsed.services.length : 0;

        setPendingRestoreData(parsed);
        setRestoreStats({ songs: songCount, folders: folderCount, services: serviceCount });
      } catch (err: any) {
        showToast('Ficheiro de cópia de segurança inválido: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);

    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestoreData) return;

    try {
      setIsRestoring(true);
      const res = await settingsApi.restoreBackup(pendingRestoreData);
      await queryClient.invalidateQueries();

      showToast(
        `Cópia de segurança restaurada com sucesso! (${res.counts?.songs || 0} cânticos, ${res.counts?.folders || 0} pastas, ${res.counts?.services || 0} cultos)`,
        'success'
      );
      setPendingRestoreData(null);
      setRestoreStats(null);
    } catch (err: any) {
      showToast('Erro ao restaurar cópia de segurança: ' + (err?.message || 'Falha ao processar'), 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  if (settingsQuery.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Spinner size="lg" label="A carregar definições do Hosanna Studio..." />
      </div>
    );
  }

  const pendingCount = pendingAdmins.length;

  return (
    <div className={`flex-1 flex flex-col w-full mx-auto space-y-6 overflow-y-auto h-full ${hideHeader ? 'p-6' : 'p-4 sm:p-6 max-w-5xl'}`}>
      {/* Header Banner */}
      {!actualHideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <Settings className="w-6 h-6 text-[#0284c7]" />
              Definições da Organização e Administração
            </h1>
          </div>

          <Badge variant="emerald">
            <Server className="w-3.5 h-3.5 mr-1" />
            Servidor Hosana Ativo
          </Badge>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'general'
              ? 'bg-[#0284c7] text-white shadow-md shadow-[#0284c7]/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Geral e Servidor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('admins')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer relative ${
            activeTab === 'admins'
              ? 'bg-[#0284c7] text-white shadow-md shadow-[#0284c7]/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Administradores</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-[#0284c7] text-white shadow-md shadow-[#0284c7]/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Cópias de Segurança</span>
        </button>
      </div>

      {/* ==================== TAB 1: GENERAL & SERVER SETTINGS ==================== */}
      {activeTab === 'general' && (
        <form onSubmit={handleSubmitSettings} className="space-y-6">
          {/* Theme and Appearance */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#0284c7]" />
              Aparência e Tema Visual
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { if (darkMode) toggleDarkMode(); }}
                className={`p-4 rounded-2xl border flex items-center gap-3.5 transition-all text-left cursor-pointer ${
                  !darkMode
                    ? 'border-[#0284c7] bg-sky-50/60 dark:bg-sky-950/40 text-slate-900 dark:text-slate-100 ring-2 ring-[#0284c7]/20 font-bold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 shrink-0">
                  <Sun className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Modo Claro</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Interface limpa com fundo claro de alto contraste</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { if (!darkMode) toggleDarkMode(); }}
                className={`p-4 rounded-2xl border flex items-center gap-3.5 transition-all text-left cursor-pointer ${
                  darkMode
                    ? 'border-[#0284c7] bg-sky-50/60 dark:bg-sky-950/40 text-slate-900 dark:text-slate-100 ring-2 ring-[#0284c7]/20 font-bold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-slate-800 text-sky-400 shrink-0">
                  <Moon className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Modo Escuro</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Tema escuro confortável para ambientes com pouca luz</span>
                </div>
              </button>
            </div>
          </div>

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
                onChange={(e) => setFormState({ ...formState, serverName: e.target.value })}
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
                  onChange={(e) => setFormState({ ...formState, defaultKey: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                >
                  {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map((k) => (
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
                onChange={(e) => setFormState({ ...formState, syncIntervalSeconds: Number(e.target.value) })}
                icon={<RefreshCw className="w-4 h-4 text-slate-400" />}
                placeholder="30"
              />

              <Input
                label="Limite Máximo de Upload por Ficheiro (MB)"
                type="number"
                value={formState.maxUploadMB}
                onChange={(e) => setFormState({ ...formState, maxUploadMB: Number(e.target.value) })}
                icon={<HardDrive className="w-4 h-4 text-slate-400" />}
                placeholder="50"
              />
            </div>
          </div>

          {/* Security Policies */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#0284c7]" />
              Políticas de Acesso e Armazenamento
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3.5 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={formState.autoBackupEnabled}
                  onChange={(e) => setFormState({ ...formState, autoBackupEnabled: e.target.checked })}
                  className="w-4 h-4 text-[#0284c7] rounded-md focus:ring-[#0284c7] cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Ativar Cópias de Segurança Automáticas da Base de Dados
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Garante que todas as alterações às cifras, pastas e cultos sejam persistidas e salvaguardadas automaticamente.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3.5 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={formState.allowPublicRead}
                  onChange={(e) => setFormState({ ...formState, allowPublicRead: e.target.checked })}
                  className="w-4 h-4 text-[#0284c7] rounded-md focus:ring-[#0284c7] cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Permitir Pesquisa Pública de Cânticos Apenas de Leitura (Sem Autenticação)
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Permite que músicos e leitores consultem a biblioteca em modo de leitura sem autorizações administrativas.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isUpdating}
                icon={<Save className="w-4 h-4" />}
              >
                Guardar Definições do Servidor
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* ==================== TAB 2: ADMINISTRATORS MANAGEMENT ==================== */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          {/* Header & Stats */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#0284c7]" />
                Gestão de Administradores
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Gira utilizadores com privilégios administrativos e aprove contas pendentes
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Stats badges */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#0284c7]" />
                  {admins.length} Administrador(es)
                </span>

                {pendingCount > 0 && (
                  <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-extrabold flex items-center gap-1.5 animate-pulse">
                    <Clock className="w-3.5 h-3.5" />
                    {pendingCount} Pending Approval{pendingCount > 1 ? 's' : ''}
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
                Convidar Administrador
              </Button>
            </div>
          </div>

          {/* Pending Approval Section Alert if any */}
          {pendingCount > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <span>
                  Existem <strong>{pendingCount}</strong> conta(s) a aguardar aprovação por um administrador da organização.
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
                      <th className="py-3.5 px-4">Função</th>
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
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0284c7] to-sky-400 flex items-center justify-center text-white font-extrabold text-xs shadow-sm shrink-0">
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

                          {/* Role */}
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {admin.role || 'Admin'}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-4">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approved
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
                                <Clock className="w-3.5 h-3.5" />
                                Pending Approval
                              </span>
                            )}
                          </td>

                          {/* Registered Date */}
                          <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-medium">
                            {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
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
                                  Approve
                                </Button>
                              )}

                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isSelf}
                                title={isSelf ? 'Não pode remover a sua própria conta' : 'Remover utilizador'}
                                className={`text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900/50 dark:hover:bg-rose-950/50 ${
                                  isSelf ? 'opacity-40 cursor-not-allowed' : ''
                                }`}
                                icon={<Trash2 className="w-3.5 h-3.5" />}
                                onClick={() => !isSelf && setAdminToRemove(admin)}
                              >
                                Remove
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
      )}

      {/* ==================== TAB 3: BACKUP ENGINE ==================== */}
      {activeTab === 'backup' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              Gestão da Cópia de Segurança
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Formato .JSON</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Export Section */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-sky-100 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 text-[#0284c7] rounded-xl shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Descarregar Ficheiro de Backup
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Exporta a base de dados atual num ficheiro JSON estruturado e seguro.
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
                Transferir Cópia de Segurança (.json)
              </Button>
            </div>

            {/* Restore Section */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Restaurar Base de Dados & API
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Carregue um ficheiro JSON previamente exportado para recuperar todos os dados.
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
                className="w-full justify-center"
              >
                Selecionar Ficheiro de Backup
              </Button>
            </div>
          </div>
        </div>
      )}

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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Função (Role)
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
            >
              <option value="admin">Administrador (Total Privileges)</option>
              <option value="leader">Líder de Louvor</option>
            </select>
          </div>

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
        title="Remover Administrador"
      >
        <div className="flex flex-col gap-4">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-3 text-xs text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <strong className="font-bold">Atenção ao Remover:</strong>
              <p className="mt-0.5">
                Tem a certeza que deseja remover o administrador{' '}
                <strong>{adminToRemove?.name}</strong> ({adminToRemove?.email})? Esta ação revogará imediatamente todos os privilégios de acesso.
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
              Remover Administrador
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
                Esta ação irá substituir a totalidade dos dados existentes na base de dados e API pelos dados contidos no ficheiro de cópia de segurança.
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
                  <span className="block text-lg font-extrabold text-[#0284c7]">{restoreStats.songs}</span>
                  <span className="text-[10px] text-slate-500">Cânticos</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="block text-lg font-extrabold text-amber-500">{restoreStats.folders}</span>
                  <span className="text-[10px] text-slate-500">Pastas</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="block text-lg font-extrabold text-emerald-500">{restoreStats.services}</span>
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
    </div>
  );
};
