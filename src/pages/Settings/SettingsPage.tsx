/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSettings } from '../../hooks/useSettings';
import { useSync } from '../../contexts/SyncContext';
import { useTheme } from '../../contexts/ThemeContext';
import { settingsApi } from '../../api/settings';
import { ServerSettings } from '../../types';
import {
  Settings, Shield, Save, Server, Download, Upload,
  Database, AlertTriangle, FileJson, CheckCircle2, RotateCcw,
  Globe, HardDrive, KeyRound, RefreshCw, Sun, Moon, Palette
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
  const context = useOutletContext<any>() || {};
  const actualHideHeader = hideHeader ?? context.hideHeader;
  const { darkMode, toggleDarkMode } = useTheme();
  const { settingsQuery, updateSettings, isUpdating } = useSettings();

  const [formState, setFormState] = useState<ServerSettings>({
    serverName: 'Hosana Studio Server',
    port: 3000,
    defaultKey: 'G',
    syncIntervalSeconds: 30,
    allowPublicRead: false,
    autoBackupEnabled: true,
    maxUploadMB: 50,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formState);
    showToast('Definições do servidor guardadas com sucesso!', 'success');
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
      link.download = `hosana-studio-backup-${dateStr}.json`;
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
        if (!parsed || (typeof parsed !== 'object')) {
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

    // Reset input value so the same file can be re-selected if needed
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestoreData) return;

    try {
      setIsRestoring(true);
      const res = await settingsApi.restoreBackup(pendingRestoreData);

      // Invalidate all React Query caches so all pages refresh automatically
      await queryClient.invalidateQueries();

      showToast(`Cópia de segurança restaurada com sucesso! (${res.counts?.songs || 0} cânticos, ${res.counts?.folders || 0} pastas, ${res.counts?.services || 0} cultos)`, 'success');
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
        <Spinner size="lg" label="A carregar definições do Hosana Studio..." />
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col w-full mx-auto space-y-6 overflow-y-auto h-full ${hideHeader ? 'p-6' : 'p-4 sm:p-6 max-w-4xl'}`}>
      {/* Header Banner */}
      {!actualHideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <Settings className="w-6 h-6 text-[#0284c7]" />
              Definições do Servidor e Cópias de Segurança
            </h1>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 0: Theme and Appearance */}
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

        {/* Card 1: Server Configuration Settings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Server className="w-4 h-4 text-[#0284c7]" />
            Configuração Geral do Servidor
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>

        {/* Card 2: Security Policies */}
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

      {/* Card 3: Backup & Restore Engine */}
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

            {/* Hidden file input */}
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
