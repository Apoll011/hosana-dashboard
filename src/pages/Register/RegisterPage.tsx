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
  AlertCircle, Info, Sparkles
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import bg from '../../assets/images/background.webp';
import logo from '../../assets/logo.png';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // Tab 2: Join Organization state
  const [joinSlug, setJoinSlug] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfoBanner, setSuccessInfoBanner] = useState('');

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
    <div className="min-h-screen w-full flex items-center justify-start p-4 sm:p-8 md:p-16 relative overflow-hidden font-sans transition-colors duration-500">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={bg}
          alt="Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {/* Subtle Overlay for contrast */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-m3-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-m3-primary-dark/10 rounded-full blur-[120px] pointer-events-none z-10" />

      <div className="relative max-w-[380px] w-full bg-white border border-slate-200 rounded-[32px] shadow-2xl shadow-black/40 p-6 sm:p-8 transition-all duration-300 z-20">
        {/* Branding */}
        <div className="flex flex-col items-center text-center mb-6 select-none">
          <div
            className="
              w-22 h-22 rounded-[22px]
              flex items-center justify-center
              mb-4
              border
              transition-transform
              hover:scale-105 hover:rotate-2
            "
            style={{
              backgroundColor: "#EEF4FA",
              borderColor: "#D3E5F8",
            }}
          >
            <img
              src={logo}
              alt="Hosanna Studio"
              className="w-22 h-22 object-contain translate-y-0.5"
            />
          </div>
          <h1 className="font-display font-black text-3xl tracking-tighter text-slate-900">
            Hosanna Studio
          </h1>
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

        <form onSubmit={handleJoinSubmit} className="space-y-3.5">
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
              className="w-full h-14 bg-m3-primary hover:bg-m3-primary-dark border-0 font-black uppercase tracking-widest text-[10px] text-white mt-4 rounded-[20px] transition-all shadow-xl shadow-m3-primary/20 hover:shadow-m3-primary/40 flex items-center justify-center gap-2 group"
              isLoading={isLoading}
            >
              <span>Submeter Pedido de Registo</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
        </form>
        
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
