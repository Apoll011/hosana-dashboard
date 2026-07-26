/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { httpClient } from '../../api/client';
import { Layers, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import bg from '../../assets/images/background.webp';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [serverUrl, setServerUrl] = useState(httpClient.getBaseURL());
  const [email, setEmail] = useState('leader@church.org');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (!serverUrl.trim()) {
        throw new Error('Please enter the server URL');
      }
      if (!email.trim() || !password.trim()) {
        throw new Error('Please enter both email and password');
      }
      await login({ email: email.trim(), password, serverUrl: serverUrl.trim() });
      navigate('/songs', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
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

      <div className="relative max-w-[360px] w-full bg-white border border-slate-200 rounded-[32px] shadow-2xl shadow-black/40 p-6 sm:p-8 transition-all duration-300 z-20">
        {/* Branding */}
        <div className="flex flex-col items-center text-center mb-6 select-none">
          <div className="w-16 h-16 rounded-[22px] bg-gradient-to-tr from-m3-primary to-m3-primary-light flex items-center justify-center shadow-2xl shadow-m3-primary/30 mb-4 transform transition-transform hover:scale-105 hover:rotate-2">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display font-black text-3xl tracking-tighter text-slate-900">
            Hosana Studio
          </h1>
          <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-[0.4em] font-black opacity-60">
            Consola de Gestão
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Input
              label="URL do Servidor"
              placeholder="http://servidor.com/api"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              icon={<Layers className="w-4 h-4 opacity-40" />}
              className="h-11 rounded-xl border-slate-200 focus:border-m3-primary transition-all text-sm"
            />
            <Input
              type="email"
              label="E-mail"
              placeholder="admin@hosana.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4 opacity-40" />}
              className="h-11 rounded-xl border-slate-200 focus:border-m3-primary transition-all text-sm"
            />
            <Input
              type="password"
              label="Palavra-passe"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4 opacity-40" />}
              className="h-11 rounded-xl border-slate-200 focus:border-m3-primary transition-all text-sm"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full h-14 bg-m3-primary hover:bg-m3-primary-dark border-0 font-black uppercase tracking-widest text-[10px] text-white mt-4 rounded-[20px] transition-all shadow-xl shadow-m3-primary/20 hover:shadow-m3-primary/40 flex items-center justify-center gap-2 group"
            isLoading={isLoading}
          >
            <span>Iniciar Sessão</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <ShieldCheck className="w-3 h-3 text-emerald-500 opacity-60" />
          <span>Acesso Criptografado</span>
        </div>
      </div>
    </div>
  );
};

