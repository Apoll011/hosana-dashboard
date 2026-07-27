/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import bg from '../../assets/images/background.webp';
import logo from '../../assets/logo.png';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const redirectMessage = (location.state as any)?.message || '';

  const [email, setEmail] = useState('leader@church.org');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isUnapproved, setIsUnapproved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsUnapproved(false);
    setIsLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('Please enter both email and password');
      }
      await login({ email: email.trim(), password });
      navigate('/songs', { replace: true });
    } catch (err: any) {
      if (err?.code === 'ACCOUNT_NOT_APPROVED' || err?.status === 403 || err?.message?.includes('pending approval')) {
        setIsUnapproved(true);
        setErrorMsg('Your account is pending approval by a tenant administrator.');
      } else {
        setErrorMsg(err?.message || 'Authentication failed');
      }
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

        {/* Redirect Success Message */}
        {redirectMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{redirectMessage}</span>
          </div>
        )}

        {/* Error / Account Unapproved Alert */}
        {errorMsg && (
          <div
            className={`mb-4 p-3.5 rounded-xl border text-xs font-semibold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 ${
              isUnapproved
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Input
              type="email"
              label="E-mail"
              placeholder="admin@hosanna.org"
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

        {/* Link to Register */}
        <div className="mt-4 text-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-m3-primary hover:underline"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Criar ou aderir a uma organização</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
