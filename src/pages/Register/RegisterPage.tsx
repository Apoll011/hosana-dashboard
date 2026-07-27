/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { httpClient } from '../../api/client';
import {
  Layers, Lock, Mail, User, Building, ArrowRight,
  CheckCircle2, AlertCircle, Info, ShieldCheck, Sparkles
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import bg from '../../assets/images/background.webp';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  const [serverUrl, setServerUrl] = useState(httpClient.getBaseURL());

  // Tab 1: Create Organization state
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Tab 2: Join Organization state
  const [joinSlug, setJoinSlug] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfoBanner, setSuccessInfoBanner] = useState('');

  // Auto-slugify when typing organization name
  const handleTenantNameChange = (val: string) => {
    setTenantName(val);
    if (!tenantSlug || tenantSlug === tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
      setTenantSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessInfoBanner('');
    setIsLoading(true);

    try {
      if (!tenantName.trim() || !tenantSlug.trim() || !adminName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
        throw new Error('Por favor preencha todos os campos obrigatórios.');
      }

      await authApi.registerTenant({
        tenantName: tenantName.trim(),
        tenantSlug: tenantSlug.trim(),
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
        adminPassword: adminPassword,
        serverUrl: serverUrl.trim(),
      });

      // On success, redirect to login with message
      navigate('/login', {
        state: { message: 'Organization created! You can now log in.' },
        replace: true,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao criar organização');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessInfoBanner('');
    setIsLoading(true);

    try {
      if (!joinSlug.trim() || !joinName.trim() || !joinEmail.trim() || !joinPassword.trim()) {
        throw new Error('Por favor preencha todos os campos obrigatórios.');
      }

      const res = await authApi.registerUser({
        tenantSlug: joinSlug.trim(),
        name: joinName.trim(),
        email: joinEmail.trim(),
        password: joinPassword,
        serverUrl: serverUrl.trim(),
      });

      setSuccessInfoBanner(
        res.message ||
          'Registration successful! Your account is pending approval by a tenant administrator. You will be able to log in once approved.'
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao realizar registo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans transition-colors duration-500">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={bg}
          alt="Background"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      </div>

      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-m3-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none z-10" />

      <div className="relative max-w-[440px] w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-[32px] shadow-2xl shadow-black/50 p-6 sm:p-8 transition-all duration-300 z-20 my-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6 select-none">
          <div className="w-14 h-14 rounded-[20px] bg-gradient-to-tr from-m3-primary to-m3-primary-light flex items-center justify-center shadow-xl shadow-m3-primary/30 mb-3 transform transition-transform hover:scale-105">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display font-black text-2xl tracking-tighter text-slate-900 dark:text-slate-100">
            Registo Hosana Studio
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Crie a sua organização ou junte-se a uma equipa existente
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              setErrorMsg('');
              setSuccessInfoBanner('');
            }}
            className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-white dark:bg-slate-900 text-m3-primary shadow-sm font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Nova Organização</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('join');
              setErrorMsg('');
              setSuccessInfoBanner('');
            }}
            className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'join'
                ? 'bg-white dark:bg-slate-900 text-m3-primary shadow-sm font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Juntar a Organização</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Info Banner */}
        {successInfoBanner && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs leading-relaxed flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <Info className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <strong className="font-bold block mb-0.5">Registo Efetuado!</strong>
              <span>{successInfoBanner}</span>
              <div className="mt-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-900 dark:text-amber-200 underline hover:no-underline"
                >
                  Ir para a página de login
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Create Organization */}
        {activeTab === 'create' && !successInfoBanner && (
          <form onSubmit={handleCreateSubmit} className="space-y-3.5">
            <Input
              label="URL do Servidor"
              placeholder="http://servidor.com/api"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              icon={<Layers className="w-4 h-4 text-slate-400" />}
              className="h-10 rounded-xl text-xs"
            />

            <Input
              label="Nome da Organização (tenantName)"
              placeholder="Ex: Igreja Graça & Paz"
              value={tenantName}
              onChange={(e) => handleTenantNameChange(e.target.value)}
              icon={<Building className="w-4 h-4 text-slate-400" />}
              className="h-10 rounded-xl text-xs"
            />

            <Input
              label="Slug da Organização (tenantSlug)"
              placeholder="ex: graca-paz"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              icon={<Sparkles className="w-4 h-4 text-slate-400" />}
              className="h-10 rounded-xl text-xs font-mono"
            />

            <Input
              label="Seu Nome Completo (adminName)"
              placeholder="Ex: Pr. João Silva"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              icon={<User className="w-4 h-4 text-slate-400" />}
              className="h-10 rounded-xl text-xs"
            />

            <Input
              type="email"
              label="E-mail do Administrador (adminEmail)"
              placeholder="admin@igreja.org"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              icon={<Mail className="w-4 h-4 text-slate-400" />}
              className="h-10 rounded-xl text-xs"
            />

            <Input
              type="password"
              label="Palavra-passe (adminPassword)"
              placeholder="••••••••"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              icon={<Lock className="w-4 h-4 text-slate-400" />}
              className="h-10 rounded-xl text-xs"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full h-12 bg-m3-primary hover:bg-m3-primary-dark border-0 font-bold text-xs text-white mt-4 rounded-xl shadow-lg shadow-m3-primary/20 flex items-center justify-center gap-2"
              isLoading={isLoading}
            >
              <span>Criar Organização & Administrador</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}

        {/* Tab 2: Join Existing Organization */}
        {activeTab === 'join' && !successInfoBanner && (
          <form onSubmit={handleJoinSubmit} className="space-y-3.5">
            <Input
              label="URL do Servidor"
              placeholder="http://servidor.com/api"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              icon={<Layers className="w-4 h-4 text-slate-400" />}
              className="h-10 rounded-xl text-xs"
            />

            <Input
              label="Slug da Organização Existente (tenantSlug)"
              placeholder="ex: graca-paz"
              value={joinSlug}
              onChange={(e) => setJoinSlug(e.target.value)}
              icon={<Building className="w-4 h-4 text-slate-400" />}
              className="h-10 rounded-xl text-xs font-mono"
            />

            <Input
              label="Nome Completo (name)"
              placeholder="Ex: Maria Santos"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              icon={<User className="w-4 h-4 text-slate-400" />}
              className="h-10 rounded-xl text-xs"
            />

            <Input
              type="email"
              label="E-mail (email)"
              placeholder="maria@igreja.org"
              value={joinEmail}
              onChange={(e) => setJoinEmail(e.target.value)}
              icon={<Mail className="w-4 h-4 text-slate-400" />}
              className="h-10 rounded-xl text-xs"
            />

            <Input
              type="password"
              label="Palavra-passe (password)"
              placeholder="••••••••"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              icon={<Lock className="w-4 h-4 text-slate-400" />}
              className="h-10 rounded-xl text-xs"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full h-12 bg-m3-primary hover:bg-m3-primary-dark border-0 font-bold text-xs text-white mt-4 rounded-xl shadow-lg shadow-m3-primary/20 flex items-center justify-center gap-2"
              isLoading={isLoading}
            >
              <span>Submeter Pedido de Registo</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}

        {/* Footer Link */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
          Já tem uma conta ativa?{' '}
          <Link
            to="/login"
            className="font-extrabold text-m3-primary hover:underline"
          >
            Iniciar Sessão
          </Link>
        </div>
      </div>
    </div>
  );
};
