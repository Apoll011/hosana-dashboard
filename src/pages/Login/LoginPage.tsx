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
    <div className="min-h-screen w-full bg-m3-bg flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans transition-colors duration-500">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-m3-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-m3-primary-dark/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-sm w-full bg-m3-card/40 backdrop-blur-3xl border border-m3-border/30 rounded-[40px] shadow-2xl shadow-black/10 p-10 transition-all duration-300">
        {/* Branding */}
        <div className="flex flex-col items-center text-center mb-12 select-none">
          <div className="w-20 h-20 rounded-[28px] bg-gradient-to-tr from-m3-primary to-m3-primary-light flex items-center justify-center shadow-2xl shadow-m3-primary/30 mb-6 transform transition-transform hover:scale-105 hover:rotate-2">
            <Layers className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display font-black text-4xl tracking-tighter text-m3-text">
            Hosana Studio
          </h1>
          <p className="text-[10px] text-m3-secondary mt-3 uppercase tracking-[0.4em] font-black opacity-60">
            Consola de Gestão
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-black uppercase tracking-wider flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Input
              label="URL do Servidor"
              placeholder="http://servidor.com/api"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              icon={<Layers className="w-5 h-5 opacity-40" />}
              className="h-14 rounded-2xl border-m3-border/50 focus:border-m3-primary transition-all"
            />
            <Input
              type="email"
              label="E-mail"
              placeholder="admin@hosana.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-5 h-5 opacity-40" />}
              className="h-14 rounded-2xl border-m3-border/50 focus:border-m3-primary transition-all"
            />
            <Input
              type="password"
              label="Palavra-passe"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-5 h-5 opacity-40" />}
              className="h-14 rounded-2xl border-m3-border/50 focus:border-m3-primary transition-all"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full h-16 bg-m3-primary hover:bg-m3-primary-dark border-0 font-black uppercase tracking-widest text-xs text-white mt-8 rounded-[24px] transition-all shadow-xl shadow-m3-primary/20 hover:shadow-m3-primary/40 flex items-center justify-center gap-3 group"
            isLoading={isLoading}
          >
            <span>Iniciar Sessão</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </form>

        <div className="mt-12 pt-8 border-t border-m3-border/20 text-center text-[10px] text-m3-secondary/50 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 opacity-60" />
          <span>Acesso Criptografado</span>
        </div>
      </div>
    </div>
  );
};

